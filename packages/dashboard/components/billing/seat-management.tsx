'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi, RepositorySeat } from '@/lib/api/billing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Plus, Trash2 } from 'lucide-react';

interface SeatManagementProps {
  repositoryId: string;
  initialMode?: 'whitelist' | 'auto-add';
  initialMaxSeats?: number;
}

export function SeatManagement({ repositoryId, initialMode = 'auto-add', initialMaxSeats = 5 }: SeatManagementProps) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'whitelist' | 'auto-add'>(initialMode);
  const [maxSeats, setMaxSeats] = useState(initialMaxSeats);
  const [newDeveloper, setNewDeveloper] = useState('');
  const [isUpdatingMode, setIsUpdatingMode] = useState(false);

  const { data: seats, isLoading: isSeatsLoading } = useQuery({
    queryKey: ['repository-seats', repositoryId],
    queryFn: () => billingApi.getRepositorySeats(repositoryId),
  });

  const updateModeMutation = useMutation({
    mutationFn: billingApi.updateSeatMode,
    onSuccess: () => {
       // toast success
    },
    onError: () => {
       // toast error
    }
  });

  const addDeveloperMutation = useMutation({
    mutationFn: billingApi.addDeveloper,
    onSuccess: () => {
      setNewDeveloper('');
      queryClient.invalidateQueries({ queryKey: ['repository-seats', repositoryId] });
    },
  });

  const removeDeveloperMutation = useMutation({
    mutationFn: billingApi.removeDeveloper,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repository-seats', repositoryId] });
    },
  });

  const handleModeChange = async (newMode: 'whitelist' | 'auto-add') => {
    setMode(newMode);
    setIsUpdatingMode(true);
    try {
      await updateModeMutation.mutateAsync({
        repositoryId,
        mode: newMode,
        maxSeats: mode === 'auto-add' ? maxSeats : undefined
      });
    } finally {
      setIsUpdatingMode(false);
    }
  };
  
  const handleMaxSeatsChange = async (val: string) => {
      const num = parseInt(val);
      setMaxSeats(num);
      // Debounce or save on blur ideally, but for now specific save
  };

  const saveMaxSeats = async () => {
       setIsUpdatingMode(true);
    try {
      await updateModeMutation.mutateAsync({
        repositoryId,
        mode,
        maxSeats
      });
    } finally {
      setIsUpdatingMode(false);
    }
  }

  const handleAddDeveloper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeveloper.trim()) return;
    addDeveloperMutation.mutate({ repositoryId, githubUsername: newDeveloper });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Seat Assignment Mode</Label>
            <p className="text-sm text-muted-foreground">
              {mode === 'auto-add' 
                ? 'Automatically assign seats to developers who open PRs.' 
                : 'Only allow whitelisted developers to trigger reviews.'}
            </p>
          </div>
           <select 
             value={mode} 
             onChange={(e) => handleModeChange(e.target.value as 'whitelist' | 'auto-add')} 
             disabled={isUpdatingMode}
             className="flex h-9 w-[180px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
           >
                <option value="auto-add">Auto-Add</option>
                <option value="whitelist">Whitelist</option>
           </select>
        </div>

        {mode === 'auto-add' && (
          <div className="flex items-center gap-4 pt-2">
            <Label>Max Seats Limit</Label>
            <Input 
                type="number" 
                value={maxSeats} 
                onChange={(e) => handleMaxSeatsChange(e.target.value)} 
                className="w-24"
                min={1}
            />
            <Button size="sm" variant="outline" onClick={saveMaxSeats} disabled={isUpdatingMode}>
                {isUpdatingMode && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Limit
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
                {mode === 'whitelist' ? 'Whitelisted Developers' : 'Active Seats'}
            </h3>
             <span className="text-sm text-muted-foreground">
                {seats?.length || 0} used
             </span>
        </div>

        {mode === 'whitelist' && (
            <form onSubmit={handleAddDeveloper} className="flex gap-2">
            <Input
                placeholder="GitHub Username"
                value={newDeveloper}
                onChange={(e) => setNewDeveloper(e.target.value)}
                disabled={addDeveloperMutation.isPending}
            />
            <Button type="submit" disabled={addDeveloperMutation.isPending}>
                {addDeveloperMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add
            </Button>
            </form>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Developer</TableHead>
                <TableHead>Assigned At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isSeatsLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">Loading...</TableCell>
                </TableRow>
              ) : seats?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                    No seats assigned yet.
                  </TableCell>
                </TableRow>
              ) : (
                seats?.map((seat) => (
                  <TableRow key={seat.id}>
                    <TableCell className="font-medium">{seat.developerGithubUsername}</TableCell>
                    <TableCell>{new Date(seat.assignedAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                        seat.isActive 
                          ? 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80' 
                          : 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}>
                        {seat.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDeveloperMutation.mutate({ repositoryId, githubUsername: seat.developerGithubUsername })}
                        disabled={removeDeveloperMutation.isPending}
                        className="text-destructive hover:text-destructive"
                      >
                         {removeDeveloperMutation.isPending && removeDeveloperMutation.variables?.githubUsername === seat.developerGithubUsername ? (
                             <Loader2 className="h-4 w-4 animate-spin" />
                         ) : (
                            <Trash2 className="h-4 w-4" />
                         )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

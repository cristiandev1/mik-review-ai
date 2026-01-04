'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Icons } from "@/components/icons"

interface Team {
  id: string;
  name: string;
  ownerId: string;
  plan: string;
  createdAt: string;
  memberCount?: number;
  userRole?: string;
}

export default function TeamsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch teams');
      }

      setTeams(data.data || []);
    } catch (err: any) {
      setError(err.message);
      setTeams([]); // Ensure it's always an array
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete team');
      }

      fetchTeams();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Icons.spinner className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-3xl font-bold tracking-tight">Teams</h2>
           <p className="text-muted-foreground">Collaborate with your team members on code reviews.</p>
        </div>
        <Button onClick={() => router.push('/dashboard/teams/new')}>
          <Icons.plus className="mr-2 h-4 w-4" />
          Create Team
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-destructive/10 text-destructive border border-destructive/20">
          {error}
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Name</TableHead>
              <TableHead>Your Role</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(teams || []).length === 0 ? (
               <TableRow>
                 <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                   No teams found. Create one to start collaborating with your team.
                 </TableCell>
               </TableRow>
            ) : (
                (teams || []).map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        team.userRole === 'owner'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                          : team.userRole === 'admin'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                      }`}>
                        {team.userRole || 'member'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {team.memberCount || 0} {team.memberCount === 1 ? 'member' : 'members'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize text-sm">{team.plan}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(team.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/teams/${team.id}`)}
                        >
                          <Icons.settings className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                        {team.userRole === 'owner' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteTeam(team.id)}
                          >
                            <Icons.trash className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

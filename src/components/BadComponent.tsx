import React, { useState, useEffect } from 'react';

// BAD: No props interface
export const UserList = (props: any) => {
    // BAD: any type
    const [data, setData] = useState<any>(null);

    // BAD: useEffect missing dependencies and cleanup
    useEffect(() => {
        fetch('https://api.example.com/users')
            .then(res => res.json())
            .then(json => {
                // BAD: Console log left in code
                console.log('Got data:', json);
                setData(json);
            });
    }, []);

    // BAD: Using index as key
    return (
        <div>
            {data && data.map((item: any, index: number) => (
                <div key={index}>
                    {item.name}
                </div>
            ))}
            <button onClick={() => window.location.href = '/home'}>Go Home</button>
        </div>
    );
};

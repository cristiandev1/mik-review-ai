import React, { useState, useEffect } from 'react';

// BAD: No props interface and "any" everywhere
export const UserList = (props: any) => {
    const [data, setData] = useState<any>(null);
    
    // CRITICAL: Hardcoded API Key
    const SECRET_API_KEY = "sk-1234567890abcdef1234567890abcdef";

    useEffect(() => {
        // BAD: Direct SQL injection risk (simulated) in URL construction
        const query = "SELECT * FROM users WHERE id = " + props.userId;
        
        fetch('https://api.example.com/users?q=' + query, {
            headers: {
                'Authorization': SECRET_API_KEY 
            }
        })
            .then(res => res.json())
            .then(json => {
                console.log('Got data:', json); // BAD: Console log
                setData(json);
            });
    }); // BAD: Missing dependency array -> Infinite Loop!

    // BAD: Inline function, index as key, dangerouslySetInnerHTML
    return (
        <div style={{ backgroundColor: 'red' }}>
            <h1>User List</h1>
            <div dangerouslySetInnerHTML={{ __html: props.userInput }} /> 
            
            {data && data.map((item: any, index: number) => (
                <div key={index} onClick={() => console.log(item)}>
                    {item.name}
                    {/* BAD: Evaluation of arbitrary code */}
                    {eval("console.log('security risk')")}
                </div>
            ))}
        </div>
    );
};
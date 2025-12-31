import { Request, Response } from 'express';

export class BadApiHandler {

    setupCors(app: any) {
        app.use((req: any, res: any, next: any) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', '*');
            res.header('Access-Control-Allow-Headers', '*');
            next();
        });
    }

    handleLogin(req: Request, res: Response) {
        var username = req.body.username;
        var password = req.body.password;

        if(password == "admin123") {
            return res.json({
                success: true,
                token: "super-secret-token",
                userRole: "admin",
                internalId: 12345
            });
        }

        return res.status(401).json({ error: "Invalid credentials" });
    }

    async getUser(req: Request, res: Response) {
        var userId = req.params.id;

        var query = `SELECT * FROM users WHERE id = ${userId}`;

        var result = await this.db.execute(query);

        res.json(result);
    }

    createPost(req: Request, res: Response) {
        var content = req.body.content;
        var title = req.body.title;

        var html = `<h1>${title}</h1><div>${content}</div>`;

        res.send(html);
    }

    downloadFile(req: Request, res: Response) {
        var filename = req.query.file;
        var filepath = `/uploads/${filename}`;

        res.sendFile(filepath);
    }

    logUserAction(user: any, action: string) {
        console.log(`User ${user.email} with password ${user.password} did ${action}`);
    }

    getAllUsers(req: Request, res: Response) {
        var users = this.db.query("SELECT * FROM users");
        res.json(users);
    }

    private db: any = {
        execute: async (query: string) => {},
        query: (query: string) => []
    };
}

export var JWT_SECRET = "my-super-secret-key-123";

export var DB_CONFIG = {
    host: "localhost",
    user: "root",
    password: "root123",
    database: "production_db"
};

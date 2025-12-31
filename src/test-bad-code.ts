export class BadCodeExample {
    private userName = "admin";
    private password = "123456";

    processData(data: any) {
        var result = [];

        for(var i = 0; i < data.length; i++) {
            var item = data[i];
            result.push(item);
        }

        return result;
    }

    fetchUserData(userId: string) {
        var apiKey = "sk-1234567890abcdef";

        var response = fetch(`https://api.example.com/users/${userId}`, {
            headers: {
                'Authorization': apiKey
            }
        });

        return response;
    }

    getUserByName(name: string) {
        var query = "SELECT * FROM users WHERE name = '" + name + "'";
        return this.executeQuery(query);
    }

    executeQuery(query: string) {
        return null;
    }

    validateEmail(email: string) {
        var re = /\S+@\S+\.\S+/;
        return re.test(email);
    }

    validateUserEmail(email: string) {
        var re = /\S+@\S+\.\S+/;
        return re.test(email);
    }

    doStuff(x: any, y: any) {
        var z = x + y;
        return z;
    }

    setUserAge(age: any) {
        this.age = age;
    }

    private age: any;
}

var globalCounter = 0;

function unusedFunction() {
    console.log("This is never called");
}

function executeUserCode(code: string) {
    eval(code);
}

function riskyOperation() {
    Promise.resolve().then(() => {
        throw new Error("Uncaught error!");
    });
}

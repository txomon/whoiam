import { IAM, AWSError } from "aws-sdk";


class Resource {
    name: string;

    constructor(name: string) {
        this.name = name
    }
}

class Action {
    name: string;

    constructor(name: string) {
        this.name = name
    }
}

class Policy {
    name: string;
    actions: Action[];
    resources: Resource[];

    constructor(name: string) {
        this.name = name
    }

    addAction(action: Action) {
        var index = this.actions.indexOf(action)
        if (index >= 0) {
            return
        }
        this.actions.push(action)
    }

    removeAction(action: Action) {
        var index = this.actions.indexOf(action)
        if (index >= 0) {
            this.actions.splice(index, 1)
        }
    }

    addResource(resource: Resource) {
        var index = this.resources.indexOf(resource)
        if (index >= 0) {
            return
        }
        this.resources.push(resource)
    }

    removeResource(resource: Resource) {
        var index = this.resources.indexOf(resource)
        if (index >= 0) {
            this.resources.splice(index, 1)
        }
    }
}

class User {
    email: string;
    policies: Policy[];

    constructor(email: string) {
        this.email = email
    }

    addPolicy(policy: Policy) {
        var index = this.policies.indexOf(policy)
        if (index >= 0) {
            return
        }
        this.policies.push(policy)
    }

    removePolicy(policy: Policy) {
        var index = this.policies.indexOf(policy)
        if (index >= 0) {
            this.policies.splice(index, 1)
        }
    }
}

class Group {
    name: string;
    users: User[];
    policies: Policy[];

    constructor(name: string) {
        this.name = name
    }

    addUser(user: User) {
        var index = this.users.indexOf(user)
        if (index >= 0) {
            return
        }
        this.users.push(user)
    }

    removeUser(user: User) {
        var index = this.users.indexOf(user)
        if (index >= 0) {
            this.users.splice(index, 1)
        }
    }

    addPolicy(policy: Policy) {
        var index = this.policies.indexOf(policy)
        if (index >= 0) {
            return
        }
        this.policies.push(policy)
    }

    removePolicy(policy: Policy) {
        var index = this.policies.indexOf(policy)
        if (index >= 0) {
            this.policies.splice(index, 1)
        }
    }
}


class AWSStore {
    iam_cli: IAM;
    policies: object;
    users: object;
    groups: object;
    actions: object;
    resources: object;

    constructor() {
        this.iam_cli = new IAM()
    }

    refreshStore() {
        this.iam_cli.listPolicies(function (err: AWSError, data: IAM.ListPoliciesResponse) {
            if (err) {
                console.log(`AWS:IAM:listPolicies failed. ${err}`)
                return
            }
            for (var policy in data.Policies) {

            }

        })

    }

    listUsers(): User[] {
    }
}

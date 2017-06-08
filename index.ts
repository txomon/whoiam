import { IAM, AWSError } from "aws-sdk"


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
    policies: Map<string, IAM.Policy>;
    users: Map<string, IAM.User>;
    groups: Map<string, IAM.Group>;

    constructor() {
        this.iam_cli = new IAM()
        this.policies = new Map()
        this.users = new Map()
        this.groups = new Map()
    }

    fetchPolicies(marker?: string): Promise<Map<string, object>> {

        var params: IAM.ListPoliciesRequest = { MaxItems: 1000 }
        if (marker != null) {
            params.Marker = marker
        }

        return new Promise((resolve, reject) => {
            var responsePromise = this.iam_cli.listPolicies(params).promise()
            responsePromise.then((value: IAM.ListPoliciesResponse) => {
                var policies = new Map<string, object>()
                if (value.Policies) {
                    for (let iamPolicy of value.Policies) {
                        if (!iamPolicy.PolicyName) {
                            console.log(`Policy ${iamPolicy} is not created`)
                            continue
                        }
                        policies.set(iamPolicy.PolicyName, iamPolicy)
                    }
                }
                if (value.IsTruncated) {
                    this.fetchPolicies(value.Marker).then((subvalue) => {
                        policies = new Map([...policies, ...subvalue])
                        resolve(policies)
                    })
                } else {
                    resolve(policies)
                }

            })
        })
    }

    fetchUsers(): Promise<IAM.ListUsersResponse> {
        var usersPromise = new Promise<IAM.ListUsersResponse>((resolve, reject) => {
            this.iam_cli.listUsers((err: AWSError, data: IAM.ListUsersResponse) => {
                if (err) {
                    console.log(`AWS:IAM:ListUsers failed. ${err}`)
                    reject(err)
                } else {
                    resolve(data)
                }
            })
        })
        return usersPromise
    }

    fetchGroups(): Promise<IAM.ListGroupsResponse> {

    }

    refreshStore() {

    }

    listUsers(): User[] {
    }
}

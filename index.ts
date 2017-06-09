import * as AWS from "aws-sdk"
import * as RX from "rxjs"


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
    iam_cli: AWS.IAM;
    policies: Map<string, AWS.IAM.Policy>;
    users: Map<string, AWS.IAM.User>;
    groups: Map<string, AWS.IAM.Group>;

    constructor() {
        this.iam_cli = new AWS.IAM()
        this.policies = new Map()
        this.users = new Map()
        this.groups = new Map()
    }

    fetchPolicies(marker?: string): Promise<Map<string, object>> {
        var params: AWS.IAM.ListPoliciesRequest = { MaxItems: 1000 }
        if (marker != null) {
            params.Marker = marker
        }
        return new Promise((resolve, reject) => {
            this.iam_cli
                .listPolicies(params).promise()
                .then((value: AWS.IAM.ListPoliciesResponse) => {
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

    fetchUsers(marker?: string): Promise<Map<string, object>> {
        var params: AWS.IAM.ListUsersRequest = { MaxItems: 1000 }
        if (marker != null) {
            params.Marker = marker
        }
        return new Promise((resolve, reject) => {
            this.iam_cli
                .listUsers(params).promise()
                .then((value: AWS.IAM.ListUsersResponse) => {
                    var users = new Map<string, object>()
                    if (value.Users) {
                        for (let iamUser of value.Users) {
                            if (!iamUser.UserName) {
                                console.log(`Policy ${iamUser} is not created`)
                                continue
                            }
                            users.set(iamUser.UserName, iamUser)
                        }
                    }
                    if (value.IsTruncated) {
                        this.fetchPolicies(value.Marker).then((subvalue) => {
                            users = new Map([...users, ...subvalue])
                            resolve(users)
                        })
                    } else {
                        resolve(users)
                    }
                })
        })
    }

    fetchGroups(marker?: string): Promise<Map<string, object>> {
        var params: AWS.IAM.ListGroupsRequest = { MaxItems: 1000 }
        if (marker != null) {
            params.Marker = marker
        }

        return new Promise((resolve, reject) => {
            this.iam_cli
                .listGroups(params).promise()
                .then((value: AWS.IAM.ListGroupsResponse) => {
                    var groups = new Map<string, object>()
                    if (value.Groups) {
                        for (let iamGroup of value.Groups) {
                            if (!iamGroup.GroupName) {
                                console.log(`Policy ${iamGroup} is not created`)
                                continue
                            }
                            groups.set(iamGroup.GroupName, iamGroup)
                        }
                    }
                    if (value.IsTruncated) {
                        this.fetchPolicies(value.Marker).then((subvalue) => {
                            groups = new Map([...groups, ...subvalue])
                            resolve(groups)
                        })
                    } else {
                        resolve(groups)
                    }
                })
        })
    }


    refreshStore() {

    }
}


function listPolicies(params: { token?: string }): Promise<{ items: number[], token?: string, more: boolean }> {
    return new Promise<{ items: number[], token?: string, more: boolean }>((resolve, reject) => {
        if (!params.token) {
            resolve({ items: [1, 2, 3], token: 'asdf', more: true })
        } else if (params.token == 'asdf') {
            resolve({ items: [4, 5, 6], token: 'dsdf', more: true })
        } else if (params.token == 'dsdf') {
            resolve({ items: [7, 8, 9], more: false })
        } else {
            resolve({ items: [0, 0, 0], more: false })
        }

    })
}

function fetchPoliciesO(token?: string): RX.Observable<number[]> {
    // return RX.Observable.create((observer: RX.Observer<number[]>) => {
    //     observer.next([1, 2, 3, 1, 2, 3])
    //     observer.complete()
    // })
    var params: { token?: string } = {};
    if (token) {
        params.token = token
    }

    return RX.Observable.fromPromise(listPolicies(params))
        .concatMap((value, index) => {
            if (value.more) {
                return RX.Observable.zip(
                    RX.Observable.of(value.items),
                    fetchPoliciesO(value.token),
                    (input, output) => {
                        var series: number[] = [];
                        return series.concat(...input, ...output)
                    }
                )

            } else {
                return RX.Observable.of(value.items)
            }
        })
}


var observable = fetchPoliciesO()
observable.subscribe(
    (next) => console.log(`Received ${next}`),
    (error) => console.log(`Error ${error}`),
    () => console.log(`Completed`)
)
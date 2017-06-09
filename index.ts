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
    iamCli: AWS.IAM
    policies: AWS.IAM.Policy[]
    users: Map<AWS.IAM.User, string[]>
    groups: Map<AWS.IAM.Group, string[]>
    lastUpdate: number
    delaySeconds: number

    constructor(delaySeconds?: number) {
        this.iamCli = new AWS.IAM()
        this.policies = []
        this.users = new Map()
        this.groups = new Map()
        this.delaySeconds = delaySeconds || 300;
        this.lastUpdate = 0;
    }

    awsListPolicies(marker?: string): RX.Observable<AWS.IAM.Policy[]> {
        var params: AWS.IAM.ListPoliciesRequest = { MaxItems: 1000 }
        if (marker != null) {
            params.Marker = marker
        }
        return RX.Observable.fromPromise(this.iamCli.listPolicies(params).promise())
            .concatMap((value, index) => {
                if (value.IsTruncated) {
                    return RX.Observable.zip(
                        RX.Observable.of(value.Policies),
                        this.awsListPolicies(value.Marker),
                        (input: Policy[], output: Policy[]) => {
                            var series: AWS.IAM.Policy[] = [];
                            return series.concat(...input, ...output)
                        }
                    )
                } else {
                    return RX.Observable.of(value.Policies)
                }
            })
    }


    awsListUsers(marker?: string): RX.Observable<AWS.IAM.User[]> {
        var params: AWS.IAM.ListUsersRequest = { MaxItems: 1000 }
        if (marker != null) {
            params.Marker = marker
        }
        return RX.Observable.fromPromise(this.iamCli.listUsers(params).promise())
            .concatMap((value, index) => {
                if (value.IsTruncated) {
                    return RX.Observable.zip(
                        RX.Observable.of(value.Users),
                        this.awsListUsers(value.Marker),
                        (input: AWS.IAM.User[], output: AWS.IAM.User[]) => {
                            var series: AWS.IAM.User[] = [];
                            return series.concat(...input, ...output)
                        }
                    )
                } else {
                    return RX.Observable.of(value.Users)
                }
            })
    }


    awsListGroups(marker?: string): RX.Observable<AWS.IAM.Group[]> {
        var params: AWS.IAM.ListGroupsRequest = { MaxItems: 1000 }
        if (marker != null) {
            params.Marker = marker
        }
        return RX.Observable.fromPromise(this.iamCli.listGroups(params).promise())
            .concatMap((value, index) => {
                if (value.IsTruncated) {
                    return RX.Observable.zip(
                        RX.Observable.of(value.Groups),
                        this.awsListGroups(value.Marker),
                        (input: AWS.IAM.Group[], output: AWS.IAM.Group[]) => {
                            var series: AWS.IAM.Group[] = [];
                            return series.concat(...input, ...output)
                        }
                    )
                } else {
                    return RX.Observable.of(value.Groups)
                }
            })
    }

    awsListAttachedUserPolicies(username: string, marker?: string): RX.Observable<string[]> {
        var params: AWS.IAM.ListAttachedUserPoliciesRequest = { MaxItems: 1000, UserName: username }
        if (marker) {
            params.Marker = marker
        }
        return RX.Observable.fromPromise(this.iamCli.listAttachedUserPolicies(params).promise())
            .concatMap((value, index) => {
                if (!value.AttachedPolicies) {
                    return RX.Observable.of([])
                }
                var policies: string[] = []
                for (let attachedPolicy of value.AttachedPolicies) {
                    if (!attachedPolicy.PolicyArn) {
                        console.log(`${username} UserPolicyAttachment doens't have ARN => ${attachedPolicy.PolicyName}(arn:${attachedPolicy.PolicyArn})`)
                        continue
                    }
                    policies.push(attachedPolicy.PolicyArn)
                }
                if (value.IsTruncated) {
                    return RX.Observable.zip(
                        RX.Observable.of(policies),
                        this.awsListAttachedUserPolicies(username, value.Marker),
                        (input: string[], output: string[]) => {
                            var series: string[] = [];
                            return series.concat(...input, ...output)
                        }
                    )
                } else {
                    return RX.Observable.of(policies)
                }
            })
    }

    awsListAttachedGroupPolicies(groupname: string, marker?: string): RX.Observable<string[]> {
        var params: AWS.IAM.ListAttachedGroupPoliciesRequest = { MaxItems: 1000, GroupName: groupname }
        if (marker) {
            params.Marker = marker
        }
        return RX.Observable.fromPromise(this.iamCli.listAttachedGroupPolicies(params).promise())
            .concatMap((value, index) => {
                if (!value.AttachedPolicies) {
                    return RX.Observable.of([])
                }
                var policies: string[] = []
                for (let attachedPolicy of value.AttachedPolicies) {
                    if (!attachedPolicy.PolicyArn) {
                        console.log(`${groupname} GroupPolicyAttachment doens't have ARN => ${attachedPolicy.PolicyName}(arn:${attachedPolicy.PolicyArn})`)
                        continue
                    }
                    policies.push(attachedPolicy.PolicyArn)
                }
                if (value.IsTruncated) {
                    return RX.Observable.zip(
                        RX.Observable.of(policies),
                        this.awsListAttachedGroupPolicies(groupname, value.Marker),
                        (input: string[], output: string[]) => {
                            var series: string[] = [];
                            return series.concat(...input, ...output)
                        }
                    )
                } else {
                    return RX.Observable.of(policies)
                }
            })

    }
    refreshUsers(): RX.Observable<Map<AWS.IAM.User, string[]>> {
        return this.awsListUsers()
            .concatMap((value, index) => RX.Observable.from(value))
            .concatMap((value: AWS.IAM.User, index) => {
                return RX.Observable.zip(
                    RX.Observable.of(value),
                    this.awsListAttachedUserPolicies(value.UserName),
                    (user: AWS.IAM.User, policies: string[]) => {
                        return new Map([[user, policies]])
                    }
                )
            })
            .reduce((acc: Map<AWS.IAM.User, string[]>, value: Map<AWS.IAM.User, string[]>) => {
                return new Map([...acc, ...value])
            })
            .do(value => this.users = value)
    }

    refreshGroups(): RX.Observable<Map<AWS.IAM.Group, string[]>> {
        return this.awsListGroups()
            .concatMap((value, index) => RX.Observable.from(value))
            .concatMap((value: AWS.IAM.Group, index) => {
                return RX.Observable.zip(
                    RX.Observable.of(value),
                    this.awsListAttachedGroupPolicies(value.GroupName),
                    (group: AWS.IAM.Group, policies: string[]) => {
                        return new Map([[group, policies]])
                    }
                )
            })
            .reduce((acc: Map<AWS.IAM.Group, string[]>, value: Map<AWS.IAM.Group, string[]>) => {
                return new Map([...acc, ...value])
            })
            .do(value => this.groups = value)
    }

    refreshStore(): RX.Observable<boolean> {
        return RX.Observable.zip(
            this.refreshUsers(),
            this.refreshGroups(),
            this.awsListPolicies(),
            (users, groups, policies) => {
                this.policies = policies
                return true
            }
        )
    }
}

var awsstore = new AWSStore()
awsstore
    .refreshUsers()
    .subscribe(
    (next) => console.log(`Received`, next),
    (error) => console.log(`Error`, error),
    () => console.log(`Completed`)
    )
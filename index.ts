import * as AWS from "aws-sdk"
import * as RX from "rxjs"
import * as RD from "redux"
import * as RO from "redux-observable"


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

class AWSBinding {
    iamCli: AWS.IAM
    awsStore: AWSStore
    lastUpdate: number
    delaySeconds: number

    constructor(delaySeconds?: number) {
        this.iamCli = new AWS.IAM()
        this.delaySeconds = delaySeconds || 300;
        this.lastUpdate = 0;
    }

    awsGetPolicy(): RX.Observable<AWS.IAM.Policy> {
        return RX.Observable.fromPromise(this.iamCli.getPolicy().promise())
            .map((value, index) => value.Policy)
    }

    awsListPolicies(marker?: string): RX.Observable<AWS.IAM.Policy> {
        var params: AWS.IAM.ListPoliciesRequest = { MaxItems: 1000 }
        if (marker != null) {
            params.Marker = marker
        }
        return RX.Observable.fromPromise(this.iamCli.listPolicies(params).promise())
            .concatMap((value, index) => {
                var policies = value.Policies ? value.Policies : []
                if (value.IsTruncated) {
                    return RX.Observable.from(policies)
                        .concat(this.awsListPolicies(value.Marker))
                } else {
                    return RX.Observable.from(policies)
                }
            })
    }


    awsGetUser(username: string): RX.Observable<AWS.IAM.User> {
        return RX.Observable.fromPromise(this.iamCli.getUser({ UserName: username }).promise())
            .map((value, index) => value.User)
    }

    awsListUsers(marker?: string): RX.Observable<AWS.IAM.User> {
        var params: AWS.IAM.ListUsersRequest = { MaxItems: 1000 }
        if (marker != null) {
            params.Marker = marker
        }
        return RX.Observable.fromPromise(this.iamCli.listUsers(params).promise())
            .concatMap((value, index) => {
                var users = value.Users ? value.Users : []
                if (value.IsTruncated) {
                    return RX.Observable.from(users)
                        .concat(this.awsListUsers(value.Marker))
                } else {
                    return RX.Observable.from(value.Users)
                }
            })
    }

    awsCreateUser(username: string): RX.Observable<AWS.IAM.User> {
        var params: AWS.IAM.CreateUserRequest = { UserName: username, Path: '/emails/' }
        return RX.Observable.fromPromise(this.iamCli.createUser(params).promise())
            .concatMap((value, index) => {
                if (value.User) {
                    return RX.Observable.of(value.User)
                }
                return RX.Observable.empty()
            })
    }

    awsDeleteUser(username:string): RX.Observable<null>{
        var params: AWS.IAM.DeleteUserRequest = { UserName: username}
    }

    awsGetGroup(groupname: string): RX.Observable<AWS.IAM.Group> {
        return RX.Observable.fromPromise(this.iamCli.getGroup({ GroupName: groupname }).promise())
            .map((value, index) => value.Group)
    }

    awsListGroups(marker?: string): RX.Observable<AWS.IAM.Group> {
        var params: AWS.IAM.ListGroupsRequest = { MaxItems: 1000 }
        if (marker != null) {
            params.Marker = marker
        }
        return RX.Observable.fromPromise(this.iamCli.listGroups(params).promise())
            .concatMap((value, index) => {
                if (value.IsTruncated) {
                    return RX.Observable.from(value.Groups)
                        .concat(this.awsListGroups(value.Marker))
                } else {
                    return RX.Observable.from(value.Groups)
                }
            })
    }

    awsListAttachedUserPolicies(username: string, marker?: string): RX.Observable<string> {
        var params: AWS.IAM.ListAttachedUserPoliciesRequest = { MaxItems: 1000, UserName: username }
        if (marker) {
            params.Marker = marker
        }
        return RX.Observable.fromPromise(this.iamCli.listAttachedUserPolicies(params).promise())
            .concatMap((value, index) => {
                if (!value.AttachedPolicies) {
                    return RX.Observable.from([])
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
                    return RX.Observable.from(policies)
                        .concat(this.awsListAttachedUserPolicies(username, value.Marker))
                } else {
                    return RX.Observable.from(policies)
                }
            })
    }

    awsListAttachedGroupPolicies(groupname: string, marker?: string): RX.Observable<string> {
        var params: AWS.IAM.ListAttachedGroupPoliciesRequest = { MaxItems: 1000, GroupName: groupname }
        if (marker) {
            params.Marker = marker
        }
        return RX.Observable.fromPromise(this.iamCli.listAttachedGroupPolicies(params).promise())
            .concatMap((value, index) => {
                if (!value.AttachedPolicies) {
                    return RX.Observable.from([])
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
                    return RX.Observable.from(policies)
                        .concat(this.awsListAttachedGroupPolicies(groupname, value.Marker))
                } else {
                    return RX.Observable.from(policies)
                }
            })

    }

    refreshUsers(): RX.Observable<Map<AWS.IAM.User, string[]>> {
        return this.awsListUsers()
            .concatMap((value: AWS.IAM.User, index) => {
                return RX.Observable.zip(
                    RX.Observable.of(value),
                    this.awsListAttachedUserPolicies(value.UserName),
                    (user: AWS.IAM.User, policies: string[]) => {
                        return new Map([[user, policies]])
                    }
                )
            })
    }

    refreshGroups(): RX.Observable<Map<AWS.IAM.Group, string[]>> {
        return this.awsListGroups()
            .concatMap((value: AWS.IAM.Group, index) => {
                return RX.Observable.zip(
                    RX.Observable.of(value),
                    this.awsListAttachedGroupPolicies(value.GroupName),
                    (group: AWS.IAM.Group, policies: string[]) => {
                        return new Map([[group, policies]])
                    }
                )
            })
    }

    refreshStore(): RX.Observable<boolean> {
        return RX.Observable.zip(
            this.refreshUsers(),
            this.refreshGroups(),
            (users, groups) => {
                return true
            }
        )
    }
}

class AWSStore {
    store: any
    binding: AWSBinding
    policies: AWS.IAM.Policy[]
    users: Map<AWS.IAM.User, string[]>
    groups: Map<AWS.IAM.Group, string[]>

    constructor() {
        this.binding = new AWSBinding()
        this.store = RD.createStore(
            this.createRootReducer(),
            RD.applyMiddleware(
                RO.createEpicMiddleware(this.createRootEpic())
            )
        )
    }
    createRootReducer(): any {

    }
    createRootEpic(): any {

    }

    policyEpic() {

    }

    createUser(username) {

    }
}



var awsstore = new AWSBinding()
awsstore
    .awsListPolicies()
    .subscribe(
    (next) => console.log(`Received`, next),
    (error) => console.log(`Error`, error),
    () => console.log(`Completed`)
    )
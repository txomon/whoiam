import { TypedRecord, makeTypedFactory } from 'typed-immutable-record';
import * as IM from "immutable"


// Snippets of code from the internet follow
interface Reducer<StateType, ActionType> {
    (state?: StateType, action?: ActionType): StateType;
}


interface RecordReducer<RecordType extends TypedRecord<RecordType>, ActionType> {
    (state?: RecordType, action?: ActionType): RecordType;
}


type RecordReducerMap<PlainType, ActionType> = {
    [P in keyof PlainType]: Reducer<PlainType[P], ActionType>;
};


function combineReducers<RecordType extends TypedRecord<RecordType>, PlainType, ActionType>(
    reducerMap: RecordReducerMap<PlainType, ActionType>,
    initialState: RecordType,
): RecordReducer<RecordType, ActionType> {
    return function (state: RecordType = initialState, action: ActionType): RecordType {
        let newState = state;

        for (const key in reducerMap) {
            if (reducerMap.hasOwnProperty(key)) {
                const reducer = reducerMap[key];
                newState = newState.set(key, reducer(newState.get(key), action));
            }
        }

        return newState;
    };
}

// Used to denote "any action type not handled by this reducer".
type OtherAction = { type: '' };
const OtherAction: OtherAction = { type: '' };


// Custom code using the resources

/**
 * CreateUser is dispatched by the user when he wants to create a
 * new user
 */

interface CreateUser {
    type: "CREATE_USER",
    payload: {
        username: string,
    }
}

function createCreateUserAction(username: string): CreateUser {
    return { type: "CREATE_USER", payload: { username: username } }
}

/**
 * UserCreated is dispatched by the Epics when a user has been created
 * so that the tracking of the user creation can be completed
 */
interface UserCreated {
    type: "USER_CREATED",
    payload: {
        user: AWS.IAM.User,
    }
}

function createUserCreatedAction(user: AWS.IAM.User): UserCreated {
    return { type: "USER_CREATED", payload: { user: user } }
}

/**
 * GetUsers is dispatched by the user when he wants to refresh the users
 * it's also dispatched by the Epics when appropriate
 */
interface GetUsers {
    type: "GET_USERS",
}

function createGetUsersAction(): GetUsers {
    return { type: "GET_USERS" }
}

/**
 * UserAdded is dispatched by the Epics when a user is to be added to
 * store
 */
interface UserAdded {
    type: 'USER_ADDED'
    payload: {
        user: AWS.IAM.User
    }
}
function createUserAddedAction(user): UserAdded {
    return { type: "USER_ADDED", payload: { user: user } }
}

/**
 * CreateUser is dispatched by the user when he wants to delete a
 * new user
 */

interface DeleteUser {
    type: "DELETE_USER",
    payload: {
        username: string,
    }
}

function createDeleteUserAction(username: string): DeleteUser {
    return { type: "DELETE_USER", payload: { username: username } }
}


type AllUserActions = CreateUser | UserCreated | GetUsers | UserAdded | DeleteUser

function userReducer(
    state: any = IM.fromJS({ users: [], processingUsers: {} }),
    action: AllUserActions
): any {
    switch (action.type) {
        case "CREATE_USER":
            if (state.getIn(['processingUsers', action.payload.username])) {
                console.log('Create user ')
            }
            return state.updateIn(['processingUsers', action.payload.username], 'creating')
        case "USER_CREATED":
            return state.updateIn(['processingUsers'],
                (processingUsers) => processingUsers.filter((key, value) => {
                    if (key !== action.payload.user.UserName) {
                        return true
                    }
                    if (value !== 'creating') {
                        console.log(`Error, deleting processingUsers[${action.payload.user.UserName}] was not saved as creating but as ${value}`)
                    }
                    return false
                })
            )
        case "USER_ADDED":
            var isAlready = false
            for (var user of state.users) {
                if (user.UserName == action.payload.user.UserName) {
                    isAlready = true
                    console.log('Error, user to be added is already part of the list')
                }
            }
            if (!isAlready) {
                return state.updateIn(['users'], users => users.push(action.payload.user))
            }
            return state
        case "DELETE_USER":
            return state.updateIn(['processingUsers'])
        case "GET_USERS":
        default:
            return state
    }
}

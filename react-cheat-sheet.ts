import React from 'react';
import ReactDOM from 'react-dom';
import { createBrowserHistory } from 'history';
import axios from 'axios';

/*
*   complete store configuration, starts here
*/
import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import loggerMiddleware from 'redux-logger';
import { composeWithDevTools } from 'redux-devtools-extension';

// default redux state

class Session {
    constructor(
        authenticated = false,
        username = '',
        email = '',
        password = '',
        token = '',
    ) {
        this.authenticated = authenticated,
        this.username = username;
        this.email = email;
        this.password = password;
        this.token = token;
    }
};

const defaultState = {
    session: new Session(),
    name: null,
    pets: [],
}
const reducers = {
    session = (state = defaultState.session, action) => {
        switch (action.type) {
            case myTypes.SIGNUP:
                return {
                    ...state,
                    ...action.payload,
                }
            case myTypes.LOGIN:
                return {
                    ...state,
                    authenticated: action.payload,
                }
            case myTypes.LOGOUT:
                return {
                    ...state,
                    ... new Session(),
                }
        }
    },
    business = (state = defaultState.pets, action) => {
        // modify defaultState.pets
    }
}
// Redux Thunk middleware allows you to write action creators that return a function instead of an action
const configureMiddleware = config => {
    // Redux Thunk supports injecting a custom argument using the withExtraArgument function
    // https://github.com/reduxjs/redux-thunk#injecting-a-custom-argument
    const middlewares = [thunkMiddleware.withExtraArgument(config)]; // in this case, 'config' is { history, services: { api } }, and will be available when 'dispatch' is invoked inside an action: const actionName = (params) => { return (dispatch, getState, api) => { ... api is available here, and the thunk function can now use the api for async work }}
    if (process.env.NODE_ENV === 'development') {
        middlewares.push(loggerMiddleware);
    }
    return middlewares;
}

// combineReducers (Function): A reducer that invokes every reducer inside the reducers object, and constructs a state object with the same shape.
const lastActionReducerEnhancer = reducer => (
    { lastAction, ...state }, // destructure the state, isolate the last action called
    action,
) => ({
    ...reducer(state, action), // see previous comment
    lastAction: action,
});

// compose: ƒ (arg) { return arg; }
// compose() simply combines the functions passed to it as parameters. In this case, the second parameter (the reducers), are passed to the first argument
const createRootReducer = compose(lastActionReducerEnhancer, combineReducers);

export const configureStore = config => preloadedState => {
    const middlewares = configureMiddleware(config); // returns array of thunk functions
    const composeEnhancers = composeWithDevTools;

    return createStore(
        createRootReducer(reducers), // returns all reducers + last action
        preloadedState, // returns { session }, see 'global store configuration' below
        composeEnhancers(applyMiddleware(...middlewares)), // dev tools extension
    )
}

/*
*   complete store configuration, ends here
*/

// define api interface
const api = (API_URL = 'https://default/api/url') => {
    return {
        aGetMethod: async (queryParamsString) => {
            let baseUrl = `${API_URL}/api/item/${queryParamsString}`;

            try {
                let response = await axios.get(baseUrl);
                return response.data;
            } catch (error) {
                console.error(error);
            }
        },
        // ... same for GET, POST, PUT, DELETE
    }
};

// define local storage interface
const LocalStorage = {
    readLocalStorage: () => {
        const session = localStorage.getItem('session');
        return JSON.parse(session);
    },
    // same for saving and deleting to/from local storage
};

const session = LocalStorage.readLocalStorage();

// define store
const history = createBrowserHistory();

// global store configuration
const store = configureStore({
    history,
    services: { api }, // there might be multiple services
})({
    session
});

ReactDOM.render(
    <Root { ...store, history } />,
    document.getElementById('root'),
);

import { Suspense } from 'react';
import { connect, Provider } from 'react-redux';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';

const Root = ({ store, history, ...props }) => (
    <Provider store={ store }>
        <Router history={ history }>
            <SnackbarProvider maxSnack={ 3 }>
                <Suspense fallback={ null }>
                    <App { ...props } />
                </Suspense>
            </SnackbarProvider>
        </Router>
    </Provider>
);

const App = () => (
    <Router>
        <div>
            <Switch>
                <Route exact path='/' component={ HomeContainer } />
                <Route path={'/user/:id'} component={ UserFunctionalComponent } />
            </Switch>
        </div>
    </Router>
);

/*
*   Container component
*/
import { Component } from 'react';
import { withSnackbar } from 'notistack';

class HomeContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            stringState: null,
            redirect: false,
        }
    }

    componentDidMount() {
        // init component with data
    }

    componentDidUpdate(prevProp) {
        if (prevProp.stringState !== this.props.stringState) {
            // react to changes
        }
    }

    customMethod = async values => {
        let response = await this.props.reduxAction(values.name);
        if (response) {
            this.setState({
                stringState: response,
                redirect: true,
            })
        }
    }

    render() {
        if (this.state.redirect) {
            return <Redirect to={ `/user/${this.state.stringState}` }
        }
        return (
            <HomePresentationalComponent 
                someStringProp={ this.props.stringState }
            />
        )
    }
}

const mapStateToProps = state => {
    const { session, name, pets } = state
    return {
        session,
        name,
        pets,
    }
}

const mapDispatchToProps = dispatch => {
    return {
        reduxAction: name => dispatch(searchName(name))
    }
}

// usually in separate module or file
const searchName = name => {
    return async (dispatch, getState, api) => {
        try {
            let response = await api.aGetMethod(name);
            if (response) {
                dispatch(modifyName(response))
            }
        } catch (error) {
            console.error(error);
        }
    }
}

const modifyName = success => ({
    type: myTypes.LOGIN,
    payload: success,
})

connect(mapStateToProps, mapDispatchToProps)(HomeContainer)

// presentational components in .jsx files
const HomePresentationalComponent = ({
    someStringProp
}) => (
    <div>
        {
            someStringProp ? (
                <span>{ someStringProp }</span>
            ) : (
                <></>
            )
        }
    </div>
)

/*
*   TypeScript functional component
*/

// declare type of props
type componentProps = {
    message: string;
    timerMs: number;
}

const UserFunctionalComponent = (props: componentProps): JSX.Element => {
    const { message, timerMs } = props;
    // many hooks are initialized with null-ish default values
    const [name, setName] = React.useState<string | null>(null);

    // You can use Discriminated Unions for reducer actions
    // const defaultState = { numberOfPets: 0 };

    // type ACTIONTYPE = 
    //     |   { type: 'increment'; payload: number }
    //     |   { type: 'decrement'; payload: string };

    // function reducer(state: typeof defaultState, action: ACTIONTYPE) {
    //     switch (key) {
    //         case 'increment':
    //             return { numberOfPets: state.count + action.payload } // increment is of type number
    //             break;
    //         case 'decrement':
    //             return { count: state.count - +action.payload } // decrement is of type string
    //         default:
    //             break;
    //     }
    // }

    const [state, dispatch] = React.useReducer(reducer, defaultState)

    // Both of useEffect and useLayoutEffect are used for performing side effects and return an optional cleanup function which means they don't deal with returning values, 
    // no types are necessary. When using useEffect, take care not to return anything other than a function or undefined, otherwise both TypeScript and React will yell at you
    useEffect(() => {
        setTimeout(() => {
          /* do stuff */
        }, timerMs);
      }, [timerMs]);

    return (
        <>
          Count: {state.count}
          <button onClick={() => dispatch({ type: "decrement", payload: "5" })}>
            -
          </button>
          <button onClick={() => dispatch({ type: "increment", payload: 5 })}>
            +
          </button>
        </>
      );
}




import {APP_INIT} from './actionTypes';

const initialState = {
}

const app = (state = initialState, action) => {
    switch (action.type) {
        case APP_INIT:
            state = {
                ...state
            }
            break;
    }
    return state;
}

export default app;

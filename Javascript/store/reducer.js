import * as actionTypes from './actions';

const INITIAL_STATE = {
	proMode: false
};

const reducer = (state = INITIAL_STATE, action) => {
	switch (action.type) {
		case actionTypes.SETPROMODE:
			return {
				proMode: action.value
			}
		default:
			return state
	}
};

export default reducer;
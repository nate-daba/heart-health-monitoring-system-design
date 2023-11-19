import { environment } from "src/environments/environment";

const BASE_URL = environment.production? '' : 'http://localhost:5000';

export const USER_LOGIN_URL = BASE_URL + '/api/users/login';
export const USER_REGISTER_URL = BASE_URL + '/api/users/register';

export const MEASUREMENTS_URL = BASE_URL + '/api/measurements';
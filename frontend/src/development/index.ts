import { valetudoAPI } from '../api/client';
import { makeServer } from './server';

const patchAxiosClient = (host: string) => {
  valetudoAPI.defaults.baseURL = `${host}${valetudoAPI.defaults.baseURL}`;
};

export const initDevelopment = (): void => {
  const host = process.env['REACT_APP_VALETUDO_HOST'];
  if (host !== undefined) {
    patchAxiosClient(host);
    return;
  }

  makeServer('development');
};

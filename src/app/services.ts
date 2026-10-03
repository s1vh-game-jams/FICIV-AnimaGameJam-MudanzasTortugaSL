import { createBrowserJamServices, type JamServices } from '../services/jamServices';

let services: JamServices | undefined;
/** Screens share one session/catalog and one local ranking adapter. */
export function getJamServices(): JamServices {
  return services ??= createBrowserJamServices();
}

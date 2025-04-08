export const REDIRECT_URI = "http://localhost:3000";

export const AUTH_URL =
  `https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize?
  response_type=code&
  redirect_uri=${encodeURIComponent(REDIRECT_URI)}&
  client_id=${process.env.REACT_APP_CLIENT_ID}&
  state=1234&
  scope=Patient.read%20Patient.search%20
        Encounter.read%20Encounter.search%20
        MedicationRequest.read%20MedicationRequest.search%20
        AllergyIntolerance.read%20AllergyIntolerance.search%20
        Observation.read.labs%20Observation.search.labs%20
        Observation.read.vitals%20Observation.search.vitals
`.replace(/\s+/g, "");

export const TOKEN_URL =
  "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token";

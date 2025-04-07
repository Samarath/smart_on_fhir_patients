import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

const CLIENT_ID = "d7e59379-df3d-4f7b-813d-d4641a33dceb";
const REDIRECT_URI = "http://localhost:3000";
const AUTH_URL =
  `https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize?
  response_type=code&
  redirect_uri=${encodeURIComponent(REDIRECT_URI)}&
  client_id=${CLIENT_ID}&
  state=1234&
  scope=Patient.read%20Patient.search%20
        Encounter.read%20Encounter.search%20
        MedicationRequest.read%20MedicationRequest.search%20
        AllergyIntolerance.read%20AllergyIntolerance.search%20
        Observation.read.labs%20Observation.search.labs%20
        Observation.read.vitals%20Observation.search.vitals
`.replace(/\s+/g, "");
const TOKEN_URL = "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token";

interface PatientData {
  [key: string]: unknown;
}

interface TokenResponse {
  access_token: string;
  patient: string;
}

const Home = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const code = searchParams.get("code");
  const [accessToken, setAccessToken] = useState<string>("");
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (code && !accessToken) {
      exchangeCodeForToken(code);
    }
  }, [code]);

  const handleLogin = () => {
    window.location.href = AUTH_URL;
  };

  const exchangeCodeForToken = async (authCode: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("grant_type", "authorization_code");
      params.append("code", authCode);
      params.append("redirect_uri", REDIRECT_URI);
      params.append("client_id", CLIENT_ID);

      const config = {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      };

      const response = await axios.post<TokenResponse>(
        TOKEN_URL,
        params,
        config
      );
      setAccessToken(response.data.access_token);

      if (response.data.patient) {
        fetchPatientData(response.data.access_token, response.data.patient);
      }
    } catch (error) {
      console.error("Token exchange failed", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientData = async (token: string, patientId: string) => {
    try {
      const response = await axios.get<PatientData>(
        `https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4/Patient/${patientId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      setPatientData(response.data);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Failed to fetch patient data", error.message);
      }
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Epic FHIR Integration</h1>

      {!accessToken ? (
        <button
          onClick={handleLogin}
          style={{ padding: "10px", fontSize: "16px" }}
        >
          Connect to Epic
        </button>
      ) : (
        <div>
          <h3>Access Token Obtained!</h3>
          {loading && <p>Loading patient data...</p>}
        </div>
      )}

      {patientData && (
        <div
          style={{
            marginTop: "20px",
            textAlign: "left",
            maxWidth: "600px",
            margin: "auto",
          }}
        >
          <h3>Patient Record:</h3>
          <pre>{JSON.stringify(patientData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default Home;

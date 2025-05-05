import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { AUTH_URL, REDIRECT_URI, TOKEN_URL } from "../../config/config.var";

interface PatientData {
  [key: string]: unknown;
}

interface TokenResponse {
  access_token: string;
  patient: string;
}

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const code = searchParams.get("code");
  const [accessToken, setAccessToken] = useState<string>("");
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const CLIENT_ID: string | undefined = process.env.REACT_APP_CLIENT_ID;

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
      params.append("client_id", CLIENT_ID as string);

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
      console.log(response.data, "data");
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
    console.log(token, patientId, "checking");
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
      console.log(response);
      setPatientData(response.data);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Failed to fetch patient data", error.message);
      }
    }
  };

  const onClickNavigate = () => {
    navigate("/bulk");
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Epic FHIR Integration</h1>

      {!accessToken ? (
        <>
          <button
            onClick={handleLogin}
            style={{ padding: "10px", fontSize: "16px" }}
          >
            Connect to Epic
          </button>
          <button
            onClick={onClickNavigate}
            style={{ padding: "10px", fontSize: "16px" }}
          >
            Get bulk data
          </button>
        </>
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

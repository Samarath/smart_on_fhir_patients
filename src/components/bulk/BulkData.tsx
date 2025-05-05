import { useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";

const TOKEN_URL = "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token";
const REDIRECT_URI = "http://localhost:3000/bulk";
const CLIENT_ID = "b9b452f1-a8cb-473d-a62e-d17d79c866f4";
const BULK_EXPORT_URL =
  "https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4/$export";

const BulkExport = () => {
  const [accessToken, setAccessToken] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [jobStatusUrl, setJobStatusUrl] = useState<string>("");
  const [dataUrls, setDataUrls] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("");
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const code = searchParams.get("code");

  useEffect(() => {
    if (code && !accessToken) {
      console.log("Code found:", code);
      exchangeCodeForToken(code);
    }
  }, [code]);

  const handleAuthenticate = () => {
    const scopes = [
      "system/Patient.read",
      "system/Observation.read",
      "system/MedicationRequest.read",
      "system/AllergyIntolerance.read",
      "system/Encounter.read",
    ].join(" ");

    const authUrl =
      `https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize?response_type=code&redirect_uri=${encodeURIComponent(
        REDIRECT_URI
      )}&client_id=${CLIENT_ID}&state=1234&scope=${scopes}`.replace(/\s+/g, "");

    window.location.href = authUrl;
  };

  const exchangeCodeForToken = async (code: string) => {
    setLoading(true);
    console.log("Exchanging code for token:", code);
    try {
      const params = new URLSearchParams();
      params.append("grant_type", "authorization_code");
      params.append("code", code);
      params.append("redirect_uri", REDIRECT_URI);
      params.append("client_id", CLIENT_ID as string);

      const config = {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      };

      const response = await axios.post(TOKEN_URL, params, config);
      setAccessToken(response.data.access_token);
    } catch (err) {
      console.error("Token error details:", err);
    } finally {
      setLoading(false);
    }
  };
  const initiateBulkExport = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const response = await axios.get(BULK_EXPORT_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/fhir+json",
          Prefer: "respond-async",
        },
        params: {
          _type:
            "Patient,Encounter,MedicationRequest,AllergyIntolerance,Observation",
        },
      });
      setJobStatusUrl(response.headers["content-location"]);
      setStatus("In Progress");
    } catch (err) {
      console.log("Bulk export initiation failed: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const checkBulkJobStatus = async () => {
    if (!jobStatusUrl) return;
    setLoading(true);
    try {
      const response = await axios.get(jobStatusUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });
      if (response.status === 200 && response.data.output) {
        setStatus("Completed");
        setDataUrls(response.data.output.map((item: any) => item.url));
      } else if (response.status === 202) {
        setStatus("In Progress");
      }
    } catch (err) {
      console.log("Job status check failed: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (jobStatusUrl && status !== "Completed") {
      interval = setInterval(checkBulkJobStatus, 5000);
    }
    return () => clearInterval(interval);
  }, [jobStatusUrl, status]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Epic FHIR Bulk Export</h1>
      {!accessToken ? (
        <button onClick={handleAuthenticate} disabled={loading}>
          Authenticate with Epic
        </button>
      ) : !jobStatusUrl ? (
        <button onClick={initiateBulkExport} disabled={loading}>
          Start Bulk Export
        </button>
      ) : (
        <div>
          <h3>Status: {status}</h3>
          {dataUrls.length > 0 && (
            <div>
              <h4>Data URLs:</h4>
              <ul>
                {dataUrls.map((url, index) => (
                  <li key={index}>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      {url.split("/").pop() || `File ${index + 1}`}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {loading && <p>Loading...</p>}
    </div>
  );
};

export default BulkExport;

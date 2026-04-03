import streamlit as st
import requests

st.title("📄 AI Resume Analyzer")

# Initialize session state
if "token" not in st.session_state:
    st.session_state.token = None
if "analysis_result" not in st.session_state:
    st.session_state.analysis_result = None

# Login & Register Section
st.sidebar.subheader("Login")
email = st.sidebar.text_input("Email").lower().strip()
password = st.sidebar.text_input("Password", type="password")

if st.sidebar.button("Login"):
    try:
        response = requests.post("http://localhost:5000/api/auth/login", json={"email": email, "password": password})
        if response.status_code == 200:
            data = response.json()
            st.session_state.token = data["token"]
            st.success("Login successful!")
        else:
            st.error("Invalid email or password")
    except Exception as e:
        st.error(f"Login failed: {e}")

if st.sidebar.button("Register"):
    try:
        requests.post("http://localhost:5000/api/auth/register", json={
            "email": email,
            "password": password
        })
        st.success("Registration successful! Please login now.")
    except Exception as e:
        st.error(f"Registration failed: {e}")

# Load Previous Reports Section
if st.session_state.token:
    if st.sidebar.button("Load Previous Reports"):
        try:
            res = requests.get(
                "http://localhost:5000/api/resume/reports",
                headers={
                    "Authorization": f"Bearer {st.session_state.token}"
                }
            )
            if res.status_code == 200:
                reports = res.json()
                if reports:
                    st.sidebar.success("Reports loaded!")
                    for r in reports:
                        st.sidebar.write(f"Score: {r.get('atsScore', 'N/A')}%")
                else:
                    st.sidebar.info("No previous reports found.")
            else:
                st.sidebar.error("Could not fetch reports.")
        except Exception as e:
            st.sidebar.error(f"Backend connection failed: {e}")

st.divider()

# Upload and Analysis Section
st.subheader("🔍 Analyze Your Resume")
uploaded_file = st.file_uploader("Upload Resume (PDF)", type=["pdf"])
job_description = st.text_area("Enter Job Description")

# ... (Login & Sidebar code remains the same)

# 1. Action Block: Only handle data fetching here
# 1. Action Block
if st.button("Analyze Resume"):
    if not uploaded_file or not job_description.strip():
        st.error("Please upload resume and enter job description")
    else:
        with st.spinner("Analyzing..."):
            try:
                # Prepare the file and data for the request
                # IMPORTANT: Pass filename and MIME type so backend can validate
                files = {"resume": (uploaded_file.name, uploaded_file.getvalue(), "application/pdf")}
                data = {"jobDescription": job_description}
                
                # Include Authorization header if user is logged in
                headers = {}
                if st.session_state.token:
                    headers["Authorization"] = f"Bearer {st.session_state.token}"
                
                # ADDED: The actual request logic that defines 'response'
                response = requests.post(
                    "http://localhost:5000/api/resume/analyze", 
                    files=files, 
                    data=data,
                    headers=headers
                )

                if response.status_code == 200:
                    # Save to state
                    st.session_state.analysis_result = response.json()
                    st.success("Analysis Complete!")
                else:
                    st.error(f"Server Error: {response.status_code} - {response.text}")
            except Exception as e:
                # This is where your error was popping up because 'response' 
                # didn't exist if the code reached here prematurely.
                st.error(f"Connection Error: {e}")

# 2. Display Block: This handles everything based on current state
if st.session_state.analysis_result:
    st.divider()
    result = st.session_state.analysis_result
    
    st.subheader(f"🎯 ATS Score: {result.get('atsScore', 0)}%")
    
    # Matching Skills
    st.subheader("🎯 Matching Skills")
    skills = result.get("matchedSkills", [])
    st.write(" • " + " • ".join(skills) if skills else "No matching skills found.")

    # Missing Skills
    st.subheader("🎯 Missing Skills")
    missing = result.get("missingSkills", [])
    st.write(" • " + " • ".join(missing) if missing else "No missing skills found.")
    
    # Conditional Suggestions/Download
    if st.session_state.token:
        st.subheader("💡 Suggestions")
        suggestions = result.get("suggestions", [])
        if suggestions:
            for s in suggestions:
                st.write(f"- {s}")
        
        # PDF Download Logic
        # (Keep your existing PDF generation code here)
    else:
        st.info("🔒 Login to unlock suggestions and PDF download")
import streamlit as st
import requests

st.title("📄 AI Resume Analyzer")

# Initialize session state
if "token" not in st.session_state:
    st.session_state.token = None
if "user_email" not in st.session_state:
    st.session_state.user_email = None
if "analysis_result" not in st.session_state:
    st.session_state.analysis_result = None
if "loaded_reports" not in st.session_state:
    st.session_state.loaded_reports = None

# Login & Register Section
st.sidebar.subheader("Authentication")

if st.session_state.token:
    # User is logged in
    st.sidebar.success("✅ Logged In")
    st.sidebar.info(f"📧 {st.session_state.user_email}")
    if st.sidebar.button("🚪 Logout"):
        st.session_state.token = None
        st.session_state.user_email = None
        st.session_state.analysis_result = None
        st.session_state.loaded_reports = None
        st.success("Logged out successfully!")
        st.rerun()
else:
    # User is not logged in
    email = st.sidebar.text_input("Email").lower().strip()
    password = st.sidebar.text_input("Password", type="password")

    if st.sidebar.button("Login"):
        try:
            response = requests.post("http://localhost:5000/api/auth/login", json={"email": email, "password": password})
            if response.status_code == 200:
                data = response.json()
                st.session_state.token = data["token"]
                st.session_state.user_email = email
                st.success("Login successful!")
                st.rerun()
            else:
                st.error("Invalid email or password")
        except Exception as e:
            st.error(f"Login failed: {e}")

    if st.sidebar.button("Register"):
        try:
            response = requests.post("http://localhost:5000/api/auth/register", json={
                "email": email,
                "password": password
            })
            if response.status_code == 201:
                st.success("Registration successful! Please login now.")
            elif response.status_code == 400:
                error_msg = response.json().get("message", "Registration failed")
                st.error(error_msg)
            else:
                st.error("Registration failed. Please try again.")
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
                    st.session_state.loaded_reports = reports
                    st.sidebar.success("Reports loaded!")
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
                    
                    # Auto-refresh previous reports if user is logged in
                    if st.session_state.token:
                        try:
                            res = requests.get(
                                "http://localhost:5000/api/resume/reports",
                                headers={
                                    "Authorization": f"Bearer {st.session_state.token}"
                                }
                            )
                            if res.status_code == 200:
                                st.session_state.loaded_reports = res.json()
                        except Exception as e:
                            pass  # Silently fail if auto-refresh doesn't work
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
        st.divider()
        if st.button("📥 Download PDF Report"):
            try:
                pdf_payload = {
                    "atsScore": result.get("atsScore", 0),
                    "matchedSkills": result.get("matchedSkills", []),
                    "missingSkills": result.get("missingSkills", []),
                    "suggestions": suggestions
                }
                
                pdf_response = requests.post(
                    "http://localhost:5000/api/resume/download-report",
                    json=pdf_payload
                )
                
                if pdf_response.status_code == 200:
                    st.download_button(
                        label="💾 Click to Download PDF",
                        data=pdf_response.content,
                        file_name="ats_report.pdf",
                        mime="application/pdf"
                    )
                    st.success("PDF generated! Click above to download.")
                else:
                    st.error("Failed to generate PDF report")
            except Exception as e:
                st.error(f"Error generating PDF: {e}")
    else:
        st.info("🔒 Login to unlock suggestions and PDF download")

# Display Previous Reports in Tab Format
if st.session_state.loaded_reports:
    st.divider()
    st.subheader("📋 Previous Reports")

    # Create tabs for each report
    tab_list = [f"Report {i+1}" for i in range(len(st.session_state.loaded_reports))]
    tabs = st.tabs(tab_list)

    for idx, (tab, report) in enumerate(zip(tabs, st.session_state.loaded_reports)):
        with tab:
            # ── Header row: ATS score + delete button side by side ──
            col_title, col_delete = st.columns([8, 1])
            with col_title:
                st.subheader(f"🎯 ATS Score: {report.get('atsScore', 0)}%")
            with col_delete:
                st.write("")  # vertical spacing
                if st.button("🗑️ Delete", key=f"delete_{report['_id']}"):
                    try:
                        del_res = requests.delete(
                            f"http://localhost:5000/api/resume/delete-report/{report['_id']}",
                            headers={"Authorization": f"Bearer {st.session_state.token}"}
                        )
                        if del_res.status_code == 200:
                            # Remove from session state so UI updates instantly
                            st.session_state.loaded_reports = [
                                r for r in st.session_state.loaded_reports
                                if r["_id"] != report["_id"]
                            ]
                            st.success(f"Report {idx + 1} deleted successfully!")
                            st.rerun()
                        elif del_res.status_code == 404:
                            st.error("Report not found or already deleted.")
                        else:
                            st.error(f"Delete failed: {del_res.status_code}")
                    except Exception as e:
                        st.error(f"Connection error: {e}")

            # Matching Skills
            st.subheader("✅ Matching Skills")
            matched_skills = report.get("matchedSkills", [])
            if matched_skills:
                st.write(" • " + " • ".join(matched_skills))
            else:
                st.write("No matching skills found.")

            # Missing Skills
            st.subheader("❌ Missing Skills")
            missing_skills = report.get("missingSkills", [])
            if missing_skills:
                st.write(" • " + " • ".join(missing_skills))
            else:
                st.write("No missing skills found.")

            # Suggestions
            st.subheader("💡 Suggestions")
            suggestions = report.get("suggestions", [])
            if suggestions:
                for s in suggestions:
                    st.write(f"- {s}")
            else:
                st.write("No suggestions available.")
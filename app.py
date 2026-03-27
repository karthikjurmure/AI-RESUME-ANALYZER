import streamlit as st
import requests

st.title("📄 AI Resume Analyzer")

# Initialize session state for storing analysis results
if 'analysis_result' not in st.session_state:
    st.session_state.analysis_result = None

if st.button("Load Previous Reports"):
    try:
        res = requests.get("http://localhost:5000/api/resume")
        if res.status_code == 200:
            reports = res.json()
            for r in reports:
                st.subheader("🎯 ATS Score")
                st.write(f"{r['atsScore']}%")
                st.subheader("🎯 Matching Skills")
                if r['matchedSkills']:
                    st.write(" • " + " • ".join(r['matchedSkills']))
                else:
                    st.write("😞 Ohh no! No matching skills found.")
                st.subheader("🎯 Missing Skills")
                if r['missingSkills']:
                    st.write(" • " + " • ".join(r['missingSkills']))
                else:
                    st.write("😀 Hurray! No missing skills found.")
                st.subheader("💡 Suggestions")
                suggestions=r.get('suggestions', [])
                if suggestions:
                    for s in suggestions:
                        st.write(f"- {s}")
                else:
                    st.write("No suggestions available.")
                st.write("---")
        else:
            st.error("Could not fetch reports.")
    except Exception as e:
        st.error(f"Backend connection failed: {e}")

st.divider()
uploaded_file = st.file_uploader("Upload Resume (PDF)", type=["pdf"])
job_description = st.text_area("Enter Job Description")

if st.button("Analyze Resume"):
    if not uploaded_file or not job_description.strip():
        st.error("Please upload resume and enter job description")
    else:
        with st.spinner("Analyzing..."):
            try:
                files = {"resume": (uploaded_file.name, uploaded_file, "application/pdf")}
                data = {"jobDescription": job_description}

                response = requests.post(
                    "http://localhost:5000/api/resume/analyze",
                    files=files,
                    data=data
                )

                if response.status_code == 200:
                    result = response.json()
                    st.session_state.analysis_result = result  # Store result in session state
                    st.success("Analysis Complete!")
                    st.subheader(f"🎯 ATS Score: {result.get('atsScore', 0)}%")
                    st.subheader("🎯 Matching Skills")
                    if result.get("matchedSkills"):
                        st.write(" • " + " • ".join(result["matchedSkills"]))
                    else:
                        st.write("😞 Ohh no! No matching skills found.")
                    st.subheader("🎯 Missing Skills")
                    if result.get("missingSkills"):
                        st.write(" • " + " • ".join(result["missingSkills"]))
                    else:
                        st.write("😀 Hurray! No missing skills found.")
                    st.subheader("💡 Suggestions")
                    suggestions = result.get("suggestions", [])
                    if suggestions:
                        for s in suggestions:
                            st.write(f"- {s}")
                    else:
                        st.write("No suggestions available.")
                else:
                    st.error(f"Server Error: {response.status_code} - {response.text}")
            except Exception as e:
                st.error(f"Connection Error: Is your backend running on port 5000? {e}")


    if st.session_state.analysis_result:
        try:
            # Define a function to fetch the PDF binary from your backend
            def get_pdf_data():
                response = requests.post(
                    "http://localhost:5000/api/resume/download-report",
                    json=st.session_state.analysis_result
                )
                if response.status_code == 200:
                    return response.content  # Returns the raw binary
                else:
                    st.error("Backend failed to generate PDF.")
                    return None
            st.download_button(
                label="📥 Download ATS Report",
                data=get_pdf_data(),
                file_name="ats_report.pdf",
                mime="application/pdf"
            )
        except Exception as e:
            st.error(f"Error connecting to backend: {e}")
    else:
        st.info("Please complete an analysis first to enable the PDF download.")
  
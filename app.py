import streamlit as st
import requests

st.title("📄 AI Resume Analyzer")

# --- SIDEBAR OR TOP SECTION FOR PREVIOUS REPORTS ---
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

# --- ANALYSIS SECTION ---
uploaded_file = st.file_uploader("Upload Resume (PDF)", type=["pdf"])
job_description = st.text_area("Enter Job Description")

if st.button("Analyze Resume"):
    if not uploaded_file or not job_description.strip():
        st.error("Please upload resume and enter job description")
    else:
        with st.spinner("Analyzing..."):
            try:
                # Correct way to send file and data
                files = {"resume": (uploaded_file.name, uploaded_file, "application/pdf")}
                data = {"jobDescription": job_description}
                
                response = requests.post(
                    "http://localhost:5000/api/resume/analyze",
                    files=files,
                    data=data
                )

                if response.status_code == 200:
                    result = response.json()
                    st.success("Analysis Complete!")
                    st.subheader(f"🎯 ATS Score: {result.get('atsScore', 0)}%")
                    st.subheader("🎯 Matching Skills")
                    if result['matchedSkills']:
                        st.write(" • " + " • ".join(result['matchedSkills']))
                    else:
                        st.write("😞 Ohh no! No matching skills found.")
                    st.subheader("🎯 Missing Skills")
                    if result['missingSkills']:
                        st.write(" • " + " • ".join(result['missingSkills']))
                    else:
                        st.write("😀 Hurray! No missing skills found.")
                    st.subheader("💡 Suggestions")
                    suggestions=result.get('suggestions', [])
                    if suggestions:
                        for s in suggestions:
                            st.write(f"- {s}")
                    else:
                        st.write("No suggestions available.")
                else:
                    st.error(f"Server Error: {response.status_code} - {response.text}")
            except Exception as e:
                st.error(f"Connection Error: Is your backend running on port 5000?")
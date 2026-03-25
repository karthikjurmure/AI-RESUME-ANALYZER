import streamlit as st
import requests
st.title("📄 AI Resume Analyzer")
uploaded_file = st.file_uploader("Upload Resume (PDF)", type=["pdf"])
job_description = st.text_area("Enter Job Description")
if st.button("Analyze Resume"):
    if uploaded_file is None or job_description.strip() == "":
        st.error("Please upload resume and enter job description")
    else:
        with st.spinner("Analyzing..."):
            files = {
                "resume": uploaded_file.getvalue()
            }
            data = {
                "jobDescription": job_description
            }
            response = requests.post(
                "http://localhost:5000/api/resume/analyze",
                files={"resume": uploaded_file},
                data=data
            )
            if response.status_code == 200:
                result = response.json()
                st.success("Analysis Complete!")
                st.subheader(f"🎯 ATS Score: {result.get('atsScore', 0)}%")
                st.subheader("✅ Matched Skills")
                matched_skills=result.get("matchedSkills",[])
                if matched_skills:
                    for i,skill in enumerate(matched_skills, 1):
                        st.write(f"{i}. {skill}")
                else:
                    st.write("No matched skills found.")
                st.subheader("❌ Missing Skills")
                missing_skills = result.get("missingSkills", [])
                if missing_skills:
                    for i,skill in enumerate(missing_skills, 1):
                        st.write(f"{i}. {skill}")
                else:
                    st.write("No missing skills found.")
                st.subheader("💡 Suggestions")
                for s in result.get("suggestions", []):
                    st.write(f"- {s}")
            else:
                st.error("Error analyzing resume")
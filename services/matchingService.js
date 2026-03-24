function normalize(skill) {
  return skill
    .toLowerCase()
    .replace(/\./g, "")       
    .replace(/\s+/g, "")       
    .replace(/apis?/g, "api"); 
}

exports.matchSkills = (resumeSkills, jobSkills) => {
  console.log("RAW RESUME:", resumeSkills);
  console.log("RAW JOB:", jobSkills);
  console.log("NORMALIZED RESUME:", resumeSkills.map(normalize));
  console.log("NORMALIZED JOB:", jobSkills.map(normalize));
  const normalizedResume = resumeSkills.map(skill => normalize(skill));
  const matchedSkills = [];
  const missingSkills = [];

  jobSkills.forEach((jobSkill) => {
    const normalizedJobSkill = normalize(jobSkill);

    if (normalizedResume.includes(normalizedJobSkill)) {
      matchedSkills.push(jobSkill);
    } else {
      missingSkills.push(jobSkill);
    }
  });

  const atsScore = jobSkills.length > 0
    ? Math.round((matchedSkills.length / jobSkills.length) * 100)
    : 0;

  return {
    matchedSkills,
    missingSkills,
    atsScore
  };
};
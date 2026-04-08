from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer, util

app=FastAPI()
model=SentenceTransformer('all-MiniLM-L6-v2')
class CompareRequest(BaseModel):
    resume_skills:list
    jd_skills:list
@app.post("/match-skills")
async def match_skills(data:CompareRequest):
    resume_embeddings=model.encode(data.resume_skills,convert_to_tensor=True)
    jd_embeddings=model.encode(data.jd_skills,convert_to_tensor=True)
    cosine_scores=util.cos_sim(resume_embeddings,jd_embeddings)
    pairs=[]
    for i,resume_skill in enumerate(data.resume_skills):
        for j,jd_skill in enumerate(data.jd_skills):
            score=cosine_scores[i][j].item()
            pairs.append({
                "resume_skill":resume_skill,
                "jd_skill":jd_skill,
                "score":round(score,4)
            })
    return {
        "pairs":pairs
    }
import os
import shap.explainers._tree as st

shap_path = st.__file__
print(f"Reading {shap_path}...")
with open(shap_path, "r", encoding="utf-8") as f:
    content = f.read()

target1 = 'self.base_score = float(learner_model_param["base_score"])'
repl1 = 'self.base_score = float(str(learner_model_param["base_score"]).strip("[]"))'

target2 = 'base_score = float(learner_model_param["base_score"])'
repl2 = 'base_score = float(str(learner_model_param["base_score"]).strip("[]"))'

if target1 in content:
    content = content.replace(target1, repl1)
    print("Patched target1")
if target2 in content:
    content = content.replace(target2, repl2)
    print("Patched target2")

with open(shap_path, "w", encoding="utf-8") as f:
    f.write(content)

print("SHAP successfully patched for XGBoost 3.2+")

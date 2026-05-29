import sys, csv, re
sys.stdout.reconfigure(encoding='utf-8')
from pypdf import PdfReader

def parse_students(pdf_path):
    r = PdfReader(pdf_path)
    all_lines = []
    for page in r.pages:
        txt = page.extract_text() or ''
        for ln in txt.split('\n'):
            s = ln.strip()
            if s:
                all_lines.append(s)
    students = []
    email_pat = re.compile(r'^[\w.\-+]+@[\w.\-]+\.[a-z]{2,}$', re.I)
    phone_pat = re.compile(r'^0[7-9]\d{9}$')
    score_pat = re.compile(r'^\d{2,3}$')
    for i, line in enumerate(all_lines):
        if email_pat.match(line):
            email = line
            name  = all_lines[i-1] if i > 0 else ''
            phone_raw = all_lines[i+1].replace(' ','') if i+1 < len(all_lines) else ''
            phone = phone_raw if phone_pat.match(phone_raw) else ''
            lga = ''
            score = ''
            j = i + 2 if phone else i + 1
            while j < len(all_lines):
                if all_lines[j] == 'Enterprise Python: Backend Development':
                    candidate = all_lines[j-1]
                    if not phone_pat.match(candidate.replace(' ','')) and not email_pat.match(candidate):
                        lga = candidate
                    j += 1
                    while j < len(all_lines):
                        sc = all_lines[j].strip()
                        if score_pat.match(sc):
                            score = sc
                            break
                        j += 1
                    break
                j += 1
            students.append({'name': name, 'email': email, 'phone': phone, 'lga': lga, 'score': score})
    return students

# Class A: 44 students, classSN = A1..A44
class_a_students = parse_students('ClassA_Student_List.pdf')
for idx, s in enumerate(class_a_students):
    s['classSN'] = 'A' + str(idx + 1)
    s['class']   = 'Class A'
    s['gender']  = ''

# All students from EP Backend: 87 total
# Class A = odd overall S/N, Class B = even overall S/N
all_students = parse_students('EP_Backend_Student_List.pdf')
class_b_counter = 0
for idx, s in enumerate(all_students):
    sn = idx + 1
    if sn % 2 == 1:  # odd -> Class A
        # Find matching Class A S/N from class_a_students by email
        a_idx = next((i for i, a in enumerate(class_a_students) if a['email'] == s['email']), None)
        s['class']   = 'Class A'
        s['classSN'] = 'A' + str(a_idx + 1) if a_idx is not None else 'A?'
    else:  # even -> Class B
        class_b_counter += 1
        s['class']   = 'Class B'
        s['classSN'] = 'B' + str(class_b_counter)
    s['gender'] = ''

class_b_students = [s for s in all_students if s['class'] == 'Class B']

# Write Class A CSV (with classSN)
with open('ClassA_students.csv', 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['name', 'email', 'phone', 'gender', 'class', 'classSN'])
    for s in class_a_students:
        w.writerow([s['name'], s['email'], s['phone'], '', 'Class A', s['classSN']])

# Write Class B CSV (with classSN)
with open('ClassB_students.csv', 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['name', 'email', 'phone', 'gender', 'class', 'classSN'])
    for s in class_b_students:
        w.writerow([s['name'], s['email'], s['phone'], '', 'Class B', s['classSN']])

# Write All Students CSV (with classSN)
with open('All_students.csv', 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['name', 'email', 'phone', 'gender', 'class', 'classSN'])
    for s in all_students:
        w.writerow([s['name'], s['email'], s['phone'], '', s['class'], s['classSN']])

print("Done!")
print("Class A: " + str(len(class_a_students)) + " students")
print("Class B: " + str(len(class_b_students)) + " students")
print("All: " + str(len(all_students)) + " students")
print("")
print("Sample Class A:")
for s in class_a_students[:3]:
    print("  " + s['classSN'] + " | " + s['name'] + " | " + s['email'])
print("Sample Class B:")
for s in class_b_students[:3]:
    print("  " + s['classSN'] + " | " + s['name'] + " | " + s['email'])

import codecs

with codecs.open(r'D:\DEV\Programs_HIS_K\VIMESReceptionMangr\HMSRegistration.cpp', 'r', 'utf-16-le') as f:
    content = f.read()

start_str = 'rpt.GetReportHeader()->SetValue(_T("ExamRoom"), rs.GetValue(_T("roomname")));'
end_str = 'return rs.GetIntValue();\r\n\r\n}'

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx == -1 or end_idx == -1:
    print(f"Could not find start or end string: {start_idx}, {end_idx}")
    exit(1)

end_idx += len(end_str)

with codecs.open(r'D:\AI\VIMES_HIS\backend\migrations\temp_block_utf8.txt', 'r', 'utf-8') as f:
    replacement = f.read()

# Make sure replacement has correct line endings
replacement = replacement.replace('\r\n', '\n').replace('\n', '\r\n')

new_content = content[:start_idx] + replacement + content[end_idx:]

with codecs.open(r'D:\DEV\Programs_HIS_K\VIMESReceptionMangr\HMSRegistration.cpp', 'w', 'utf-16-le') as f:
    f.write(new_content)

print("Successfully replaced content")

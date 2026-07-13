import re

with open('src/dialer_html.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the doPull function body
# We need to add try/catch around the body and AbortController to fetch

# 1. Add try { after function doPull() {
old1 = "\t      function doPull() {\n\n\t      \t      // Collect current phone numbers"
new1 = "\t      function doPull() {\n        try {\n\n\t      \t      // Collect current phone numbers"
if old1 in content:
    content = content.replace(old1, new1, 1)
    print("Step 1 OK: added try {")
else:
    print("Step 1 FAILED: pattern not found")
    # Debug: find the function
    idx = content.find('function doPull() {')
    if idx >= 0:
        print("Found at index", idx)
        print("Context:", repr(content[idx:idx+200]))

# 2. Add AbortController before fetch
old2 = "\t      \t      fetch('/api/dialer/customers/random', {"
new2 = """\t              // AbortController with 60s timeout prevents fetch from hanging forever
\t              var controller = new AbortController();
\t              var timeoutId = setTimeout(function() { controller.abort(); }, 60000);

\t      \t      fetch('/api/dialer/customers/random', {"""
if old2 in content:
    content = content.replace(old2, new2, 1)
    print("Step 2 OK: added AbortController")
else:
    print("Step 2 FAILED: pattern not found")

# 3. Add signal to fetch options
old3 = """\t      \t        body: JSON.stringify({ limit: 50, exclude: excludeMobiles, account_id: getOrCreateAccountId() })
\t            })"""
new3 = """\t      \t        body: JSON.stringify({ limit: 50, exclude: excludeMobiles, account_id: getOrCreateAccountId() }),
\t                signal: controller.signal
\t            })"""
if old3 in content:
    content = content.replace(old3, new3, 1)
    print("Step 3 OK: added signal")
else:
    print("Step 3 FAILED: pattern not found")

# 4. Add clearTimeout in the first .then
old4 = "\t              .then(function(r) { return r.json(); })"
new4 = "\t              .then(function(r) { clearTimeout(timeoutId); return r.json(); })"
if old4 in content:
    content = content.replace(old4, new4, 1)
    print("Step 4 OK: added clearTimeout in then")
else:
    print("Step 4 FAILED: pattern not found")

# 5. Update .catch to clear timeout and handle AbortError
old5 = """\t              .catch(function(err) {
\t                btn.disabled = false;
\t                btn.textContent = '换一批';
\t                alert('网络错误: ' + err.message);
\t              });"""
new5 = """\t              .catch(function(err) {
\t                clearTimeout(timeoutId);
\t                btn.disabled = false;
\t                btn.textContent = '换一批';
\t                if (err.name === 'AbortError') {
\t                  alert('请求超时，请检查网络后重试');
\t                } else {
\t                  alert('网络错误: ' + err.message);
\t                }
\t              });"""
if old5 in content:
    content = content.replace(old5, new5, 1)
    print("Step 5 OK: updated catch")
else:
    print("Step 5 FAILED: pattern not found")
    # Debug
    idx = content.find('.catch(function(err)')
    if idx >= 0:
        print("Found catch at index", idx)
        print("Context:", repr(content[idx:idx+200]))

# 6. Add sync error catch before the closing of doPull
# The pattern is: \n\n\t      }\n\n\t      doPull();
old6 = "\n\n\t      }\n\n\t      doPull();"
new6 = """\n        } catch (syncErr) {\n          btn.disabled = false;\n          btn.textContent = '换一批';\n          alert('操作失败: ' + syncErr.message);\n        }\n\n\t      }\n\n\t      doPull();"""
if old6 in content:
    content = content.replace(old6, new6, 1)
    print("Step 6 OK: added catch block")
else:
    print("Step 6 FAILED: pattern not found")
    # Debug
    idx = content.find('\t      doPull();')
    if idx >= 0:
        print("Found doPull() at index", idx)
        print("Context:", repr(content[idx-100:idx+30]))

with open('src/dialer_html.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("File written successfully")

@echo off
echo 🛡️ Installing XSS Protection Dependencies...

echo.
echo 1. Installing DOMPurify for HTML sanitization...
npm install dompurify
npm install --save-dev @types/dompurify

echo.
echo 2. Installing ESLint Security Plugin...
npm install --save-dev eslint-plugin-security

echo.
echo 3. Creating secure ESLint configuration...
echo {> .eslintrc.security.js
echo   "extends": [>> .eslintrc.security.js
echo     "./.eslintrc.js",>> .eslintrc.security.js
echo     "plugin:security/recommended">> .eslintrc.security.js
echo   ],>> .eslintrc.security.js
echo   "plugins": ["security"],>> .eslintrc.security.js
echo   "rules": {>> .eslintrc.security.js
echo     "security/detect-object-injection": "error",>> .eslintrc.security.js
echo     "security/detect-non-literal-regexp": "error",>> .eslintrc.security.js
echo     "security/detect-unsafe-regex": "error",>> .eslintrc.security.js
echo     "security/detect-buffer-noassert": "error",>> .eslintrc.security.js
echo     "security/detect-child-process": "error",>> .eslintrc.security.js
echo     "security/detect-disable-mustache-escape": "error",>> .eslintrc.security.js
echo     "security/detect-eval-with-expression": "error",>> .eslintrc.security.js
echo     "security/detect-no-csrf-before-method-override": "error",>> .eslintrc.security.js
echo     "security/detect-non-literal-fs-filename": "error",>> .eslintrc.security.js
echo     "security/detect-non-literal-require": "error",>> .eslintrc.security.js
echo     "security/detect-possible-timing-attacks": "error",>> .eslintrc.security.js
echo     "security/detect-pseudoRandomBytes": "error">> .eslintrc.security.js
echo   }>> .eslintrc.security.js
echo }>> .eslintrc.security.js

echo.
echo 4. Adding security scripts to package.json...
npm pkg set scripts.security-check="npm audit && npm run lint:security"
npm pkg set scripts.lint:security="eslint . --config .eslintrc.security.js"

echo.
echo ✅ XSS Protection installed successfully!
echo.
echo 📌 Next steps:
echo    1. Import security functions in your components
echo    2. Replace direct user input display with SafeText/SafeHTML
echo    3. Run: npm run security-check

pause

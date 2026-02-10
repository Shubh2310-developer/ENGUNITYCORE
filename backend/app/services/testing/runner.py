import asyncio
import os
import shutil
import tempfile
import json
from typing import Dict, List, Any, Optional
from pydantic import BaseModel

class TestResult(BaseModel):
    name: str
    status: str  # passed, failed, skipped, error
    duration: float
    message: Optional[str] = None
    traceback: Optional[str] = None

class TestSuiteResult(BaseModel):
    total: int
    passed: int
    failed: int
    skipped: int
    duration: float
    results: List[TestResult]
    output: str

class TestRunner:
    """
    Service to run tests for different languages.
    Uses the CodeSandbox infrastructure where possible, or specific test runners.
    """

    async def run_tests(self, project_id: str, files: List[Dict[str, str]], language: str) -> TestSuiteResult:
        """
        Run tests for a project.

        Args:
            project_id: The project ID
            files: List of file objects {'path': '...', 'content': '...'}
            language: The programming language

        Returns:
            TestSuiteResult object
        """
        # Create temp directory
        temp_dir = tempfile.mkdtemp(prefix=f'test_run_{project_id}_')

        try:
            # Write files
            for file in files:
                file_path = os.path.join(temp_dir, file['path'])
                os.makedirs(os.path.dirname(file_path), exist_ok=True)
                with open(file_path, 'w') as f:
                    f.write(file['content'])

            # Determine test command based on language
            if language == 'python':
                return await self._run_python_tests(temp_dir)
            elif language == 'javascript' or language == 'typescript':
                return await self._run_node_tests(temp_dir)
            elif language == 'go':
                return await self._run_go_tests(temp_dir)
            else:
                # Fallback for unsupported languages or just run generic command
                return TestSuiteResult(
                    total=0, passed=0, failed=0, skipped=0, duration=0,
                    results=[], output=f"Test runner not implemented for {language}"
                )

        finally:
            # Cleanup
            try:
                shutil.rmtree(temp_dir)
            except:
                pass

    async def _run_python_tests(self, cwd: str) -> TestSuiteResult:
        """Run Python tests using pytest"""
        import time
        start_time = time.time()

        # Check if pytest is available, otherwise try unittest
        cmd = ['pytest', '--json-report', '--json-report-file=report.json']

        # If running in a containerized env, we might not have pytest installed in the environment
        # where we are running this script directly if it's the host.
        # However, assuming we are inside the backend container which has requirements installed.

        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                cwd=cwd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await process.communicate()
            duration = time.time() - start_time
            output = stdout.decode() + stderr.decode()

            # Parse JSON report if generated
            report_path = os.path.join(cwd, 'report.json')
            if os.path.exists(report_path):
                with open(report_path, 'r') as f:
                    report = json.load(f)

                results = []
                for test in report.get('tests', []):
                    status = test.get('outcome', 'unknown')
                    if status == 'passed':
                        status = 'passed'
                    elif status == 'failed':
                        status = 'failed'
                    else:
                        status = 'skipped'

                    results.append(TestResult(
                        name=test.get('nodeid', 'unknown'),
                        status=status,
                        duration=test.get('setup', {}).get('duration', 0) + test.get('call', {}).get('duration', 0) + test.get('teardown', {}).get('duration', 0),
                        message=test.get('call', {}).get('longrepr', None) if status == 'failed' else None
                    ))

                summary = report.get('summary', {})
                return TestSuiteResult(
                    total=summary.get('total', 0),
                    passed=summary.get('passed', 0),
                    failed=summary.get('failed', 0),
                    skipped=summary.get('skipped', 0),
                    duration=report.get('duration', duration),
                    results=results,
                    output=output
                )
            else:
                # Fallback to parsing stdout if JSON report fails or pytest not found
                # This assumes maybe unittest or just raw output
                return TestSuiteResult(
                    total=0, passed=0, failed=0, skipped=0, duration=duration,
                    results=[], output=output
                )

        except Exception as e:
            return TestSuiteResult(
                total=0, passed=0, failed=0, skipped=0, duration=time.time() - start_time,
                results=[], output=f"Error running tests: {str(e)}"
            )

    async def _run_node_tests(self, cwd: str) -> TestSuiteResult:
        """Run Node.js tests (assuming Jest or similar)"""
        # Checks for package.json to see test script
        import time
        start_time = time.time()

        output = ""

        # Check if package.json exists
        if os.path.exists(os.path.join(cwd, 'package.json')):
            cmd = ['npm', 'test']
        else:
            # Try running jest directly if available, or just look for .test.js files
            cmd = ['npx', 'jest']

        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                cwd=cwd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await process.communicate()
            output = stdout.decode() + stderr.decode()

            # Very basic parsing for now since we don't have json output easily guaranteed
            passed = output.count('PASS')
            failed = output.count('FAIL')

            return TestSuiteResult(
                total=passed + failed,
                passed=passed,
                failed=failed,
                skipped=0,
                duration=time.time() - start_time,
                results=[], # Detailed parsing skipped for prototype
                output=output
            )
        except Exception as e:
            return TestSuiteResult(
                total=0, passed=0, failed=0, skipped=0, duration=0,
                results=[], output=f"Error running node tests: {str(e)}\n\n{output}"
            )

    async def _run_go_tests(self, cwd: str) -> TestSuiteResult:
        """Run Go tests"""
        import time
        start_time = time.time()

        try:
            process = await asyncio.create_subprocess_exec(
                'go', 'test', '-v', './...',
                cwd=cwd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            stdout, stderr = await process.communicate()
            output = stdout.decode() + stderr.decode()

            # Parse '--- PASS: TestName (0.00s)' or '--- FAIL: TestName'
            results = []
            passed = 0
            failed = 0

            for line in output.split('\n'):
                if '--- PASS:' in line:
                    passed += 1
                    parts = line.split()
                    if len(parts) >= 3:
                        results.append(TestResult(name=parts[2], status='passed', duration=0))
                elif '--- FAIL:' in line:
                    failed += 1
                    parts = line.split()
                    if len(parts) >= 3:
                        results.append(TestResult(name=parts[2], status='failed', duration=0))

            return TestSuiteResult(
                total=passed + failed,
                passed=passed,
                failed=failed,
                skipped=0,
                duration=time.time() - start_time,
                results=results,
                output=output
            )
        except Exception as e:
            return TestSuiteResult(
                total=0, passed=0, failed=0, skipped=0, duration=0,
                results=[], output=f"Error running go tests: {str(e)}"
            )

test_runner = TestRunner()

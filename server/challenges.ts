import type { PracticeChallenge, PracticeSubmissionResult } from '../src/types';
import { executeInSandbox } from './runners.ts';

export const PRACTICE_CHALLENGES: PracticeChallenge[] = [
  {
    id: 'py-dsa-two-sum',
    title: 'Two Sum',
    tamilTitle: 'இரண்டு எண்களின் கூட்டுத்தொகை (Two Sum)',
    category: 'DSA',
    topic: 'Arrays & Hashing',
    difficulty: 'Easy',
    description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\nAssume that each input would have exactly one solution, and you may not use the same element twice.\n\nInput format:\nLine 1: Space-separated integers (array `nums`)\nLine 2: Single integer (`target`)\n\nOutput format:\nSpace-separated 0-based indices `i j`',
    tamilDescription: 'கொடுக்கப்பட்ட முழு எண்கள் பட்டியலில், கூட்டுத்தொகை `target` ஆக வரும் இரண்டு எண்களின் குறியீடுகளை (indices) அச்சிடுங்கள்.',
    examples: [
      {
        input: '2 7 11 15\n9',
        output: '0 1',
        explanation: 'Because nums[0] + nums[1] == 9, we return 0 1.',
      },
      {
        input: '3 2 4\n6',
        output: '1 2',
        explanation: 'Because nums[1] + nums[2] == 6, we return 1 2.',
      },
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      'Only one valid answer exists.',
    ],
    starterCode: {
      python: `# Two Sum - Programiz & JARVIS Practice
import sys

def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return seen[complement], i
        seen[num] = i
    return -1, -1

def main():
    lines = sys.stdin.read().strip().splitlines()
    if len(lines) >= 2:
        nums = list(map(int, lines[0].split()))
        target = int(lines[1].strip())
        i, j = two_sum(nums, target)
        print(f"{i} {j}")

if __name__ == "__main__":
    main()
`,
      javascript: `// Two Sum in JavaScript
const fs = require('fs');

function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) {
      return [map.get(diff), i];
    }
    map.set(nums[i], i);
  }
  return [-1, -1];
}

const input = fs.readFileSync(0, 'utf-8').trim().split('\\n');
if (input.length >= 2) {
  const nums = input[0].trim().split(/\\s+/).map(Number);
  const target = Number(input[1].trim());
  const [i, j] = twoSum(nums, target);
  console.log(\`\${i} \${j}\`);
}
`,
      java: `// Two Sum in Java
import java.util.*;

public class Main {
    public static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int comp = target - nums[i];
            if (map.containsKey(comp)) {
                return new int[] { map.get(comp), i };
            }
            map.put(nums[i], i);
        }
        return new int[] { -1, -1 };
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextLine()) {
            String[] parts = sc.nextLine().trim().split("\\\\s+");
            int[] nums = new int[parts.length];
            for (int i = 0; i < parts.length; i++) nums[i] = Integer.parseInt(parts[i]);
            int target = sc.nextInt();
            int[] res = twoSum(nums, target);
            System.out.println(res[0] + " " + res[1]);
        }
    }
}
`,
      cpp: `// Two Sum in C++
#include <iostream>
#include <vector>
#include <unordered_map>
#include <sstream>

using namespace std;

int main() {
    string line;
    if (getline(cin, line)) {
        stringstream ss(line);
        vector<int> nums;
        int val, target;
        while (ss >> val) nums.push_back(val);
        if (cin >> target) {
            unordered_map<int, int> seen;
            for (int i = 0; i < nums.size(); ++i) {
                int comp = target - nums[i];
                if (seen.count(comp)) {
                    cout << seen[comp] << " " << i << endl;
                    return 0;
                }
                seen[nums[i]] = i;
            }
        }
    }
    return 0;
}
`,
    },
    testCases: [
      { input: '2 7 11 15\n9', expectedOutput: '0 1', isHidden: false },
      { input: '3 2 4\n6', expectedOutput: '1 2', isHidden: false },
      { input: '3 3\n6', expectedOutput: '0 1', isHidden: true },
      { input: '1 5 8 12 19 22\n27', expectedOutput: '2 4', isHidden: true },
    ],
    hint: 'Use a Hash Map to store seen numbers and their indices to achieve an O(n) linear time complexity.',
    solutionExplanation: 'Instead of brute force O(n^2), maintain a dictionary mapping value -> index. For each number, check if (target - number) is already stored.',
  },
  {
    id: 'py-dsa-valid-palindrome',
    title: 'Valid Palindrome',
    tamilTitle: 'பாலிண்ட்ரோம் சரிபார்த்தல் (Valid Palindrome)',
    category: 'DSA',
    topic: 'Strings & Two Pointers',
    difficulty: 'Easy',
    description: 'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.\n\nInput format:\nA single line string.\n\nOutput format:\n`true` or `false`',
    tamilDescription: 'கொடுக்கப்பட்ட வாக்கியத்தை இடமிருந்து வலமாகவும் வலமிருந்து இடமாகவும் வாசிக்கும் போது ஒரே மாதிரியாக உள்ளதா என சரிபார்த்து `true` அல்லது `false` என அச்சிடுங்கள்.',
    examples: [
      {
        input: 'A man, a plan, a canal: Panama',
        output: 'true',
        explanation: '"amanaplanacanalpanama" is a palindrome.',
      },
      {
        input: 'race a car',
        output: 'false',
        explanation: '"raceacar" is not a palindrome.',
      },
    ],
    constraints: ['1 <= s.length <= 2 * 10^5'],
    starterCode: {
      python: `# Valid Palindrome - JARVIS Practice
import sys, re

def is_palindrome(s: str) -> bool:
    cleaned = re.sub(r'[^a-zA-Z0-9]', '', s).lower()
    return cleaned == cleaned[::-1]

def main():
    s = sys.stdin.read().strip()
    result = is_palindrome(s)
    print(str(result).lower())

if __name__ == "__main__":
    main()
`,
      javascript: `const fs = require('fs');

function isPalindrome(s) {
  const clean = s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return clean === clean.split('').reverse().join('');
}

const input = fs.readFileSync(0, 'utf-8').trim();
console.log(isPalindrome(input) ? 'true' : 'false');
`,
    },
    testCases: [
      { input: 'A man, a plan, a canal: Panama', expectedOutput: 'true', isHidden: false },
      { input: 'race a car', expectedOutput: 'false', isHidden: false },
      { input: ' ', expectedOutput: 'true', isHidden: true },
      { input: 'Madam, in Eden, I’m Adam', expectedOutput: 'true', isHidden: true },
    ],
    hint: 'Filter out non-alphanumeric characters, convert to lowercase, and use two pointers from both ends.',
  },
  {
    id: 'py-dsa-max-subarray',
    title: 'Maximum Subarray (Kadane’s Algorithm)',
    tamilTitle: 'அதிகபட்ச தொடர் கூட்டல் (Kadane Algorithm)',
    category: 'Algorithms',
    topic: 'Dynamic Programming',
    difficulty: 'Medium',
    description: 'Given an integer array `nums`, find the contiguous subarray (containing at least one number) which has the largest sum and print its sum.\n\nInput format:\nSpace-separated integers.\n\nOutput format:\nSingle integer representing maximum subarray sum.',
    tamilDescription: 'கொடுக்கப்பட்ட வரிசையில் அதிகபட்ச கூட்டுத்தொகை தரும் தொடர்ச்சியான துணைவரிசையின் கூட்டுத்தொகையை கண்டறியவும்.',
    examples: [
      {
        input: '-2 1 -3 4 -1 2 1 -5 4',
        output: '6',
        explanation: 'The subarray [4, -1, 2, 1] has the largest sum 6.',
      },
      {
        input: '1',
        output: '1',
      },
      {
        input: '5 4 -1 7 8',
        output: '23',
      },
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    starterCode: {
      python: `# Kadane's Algorithm
import sys

def max_subarray(nums):
    max_sum = current_sum = nums[0]
    for x in nums[1:]:
        current_sum = max(x, current_sum + x)
        max_sum = max(max_sum, current_sum)
    return max_sum

def main():
    line = sys.stdin.read().strip()
    if line:
        nums = list(map(int, line.split()))
        print(max_subarray(nums))

if __name__ == "__main__":
    main()
`,
    },
    testCases: [
      { input: '-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6', isHidden: false },
      { input: '1', expectedOutput: '1', isHidden: false },
      { input: '5 4 -1 7 8', expectedOutput: '23', isHidden: true },
      { input: '-3 -2 -1 -4', expectedOutput: '-1', isHidden: true },
    ],
    hint: 'Maintain current_sum and global max_sum. Reset current_sum if adding the next element makes it lower than the element itself.',
  },
  {
    id: 'py-dsa-valid-parentheses',
    title: 'Valid Parentheses',
    tamilTitle: 'அடைப்புக்குறிகள் சரிபார்த்தல் (Valid Parentheses)',
    category: 'DSA',
    topic: 'Stack',
    difficulty: 'Easy',
    description: 'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n\nInput format:\nA single string.\n\nOutput format:\n`true` or `false`',
    examples: [
      { input: '()[]{}', output: 'true' },
      { input: '(]', output: 'false' },
      { input: '([)]', output: 'false' },
    ],
    constraints: ['1 <= s.length <= 10^4'],
    starterCode: {
      python: `# Valid Parentheses using Stack
import sys

def is_valid(s: str) -> bool:
    stack = []
    mapping = {')': '(', '}': '{', ']': '['}
    for char in s:
        if char in mapping:
            top = stack.pop() if stack else '#'
            if mapping[char] != top:
                return False
        else:
            stack.append(char)
    return len(stack) == 0

def main():
    s = sys.stdin.read().strip()
    print(str(is_valid(s)).lower())

if __name__ == "__main__":
    main()
`,
    },
    testCases: [
      { input: '()[]{}', expectedOutput: 'true', isHidden: false },
      { input: '(]', expectedOutput: 'false', isHidden: false },
      { input: '{[()]}', expectedOutput: 'true', isHidden: true },
      { input: '(((', expectedOutput: 'false', isHidden: true },
    ],
  },
  {
    id: 'sql-top-earners',
    title: 'SQL: Highest Department Salaries',
    tamilTitle: 'SQL: அதிக சம்பளம் பெறும் ஊழியர்கள்',
    category: 'SQL',
    topic: 'Relational Queries & Grouping',
    difficulty: 'Medium',
    description: 'Write an SQL query to find employees who have the highest salary in each of the departments.\n\nTable `employees`:\n- `id` (INT), `name` (VARCHAR), `salary` (INT), `department_id` (INT)\n\nTable `departments`:\n- `id` (INT), `name` (VARCHAR)',
    examples: [
      {
        input: 'Pre-seeded schema with Employee & Department data',
        output: 'Department | Employee | Salary\nIT | Max | 90000\nSales | Henry | 80000',
      },
    ],
    constraints: ['Standard SQLite relational syntax'],
    starterCode: {
      sql: `-- SQL Highest Salary per Department
CREATE TABLE IF NOT EXISTS departments (id INTEGER PRIMARY KEY, name TEXT);
CREATE TABLE IF NOT EXISTS employees (id INTEGER PRIMARY KEY, name TEXT, salary INTEGER, department_id INTEGER);

INSERT INTO departments VALUES (1, 'IT'), (2, 'Sales');
INSERT INTO employees VALUES (1, 'Joe', 70000, 1), (2, 'Jim', 90000, 1), (3, 'Henry', 80000, 2), (4, 'Sam', 60000, 2);

-- Write your solution below:
SELECT d.name AS Department, e.name AS Employee, e.salary AS Salary
FROM employees e
JOIN departments d ON e.department_id = d.id
WHERE e.salary = (
    SELECT MAX(salary) FROM employees WHERE department_id = e.department_id
)
ORDER BY Department;
`,
    },
    testCases: [
      {
        input: '',
        expectedOutput: 'IT | Jim | 90000\nSales | Henry | 80000',
        isHidden: false,
      },
    ],
  },
];

// Submission evaluator
export async function evaluatePracticeSubmission(params: {
  challengeId: string;
  language: string;
  code: string;
}): Promise<PracticeSubmissionResult> {
  const challenge = PRACTICE_CHALLENGES.find((c) => c.id === params.challengeId) || PRACTICE_CHALLENGES[0];
  const testResults: PracticeSubmissionResult['testResults'] = [];
  let passedCount = 0;
  let totalTime = 0;
  let maxMemory = 16;

  for (let i = 0; i < challenge.testCases.length; i++) {
    const tc = challenge.testCases[i];
    const execRes = await executeInSandbox({
      language: params.language,
      code: params.code,
      stdin: tc.input,
      timeoutMs: 4000,
    });

    totalTime += execRes.executionTime;
    if (execRes.memoryMb && execRes.memoryMb > maxMemory) {
      maxMemory = execRes.memoryMb;
    }

    const actual = execRes.stdout.trim();
    const expected = tc.expectedOutput.trim();

    // Standardize whitespace comparison
    const normActual = actual.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
    const normExpected = expected.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();

    const passed = execRes.status === 'success' && (normActual === normExpected || actual === expected);
    if (passed) {
      passedCount++;
    }

    testResults.push({
      id: i + 1,
      input: tc.isHidden ? '● Hidden test case' : tc.input,
      expected: tc.isHidden ? '● Hidden expected output' : tc.expectedOutput,
      actual: tc.isHidden && !passed ? 'Test failed on private boundary input' : actual,
      passed,
      isHidden: !!tc.isHidden,
      error: execRes.status !== 'success' ? execRes.stderr || 'Runtime error' : undefined,
    });
  }

  const score = Math.round((passedCount / challenge.testCases.length) * 100);
  let jarvisFeedback = '';
  let tamilFeedback = '';

  if (score === 100) {
    jarvisFeedback = `Outstanding work, Sir! All ${challenge.testCases.length} test cases passed flawlessly in ${totalTime.toFixed(3)}s. Optimal time & space complexity achieved.`;
    tamilFeedback = `அருமை ஐயா! அனைத்து ${challenge.testCases.length} சோதனைகளும் வெற்றிகரமாக முடிவடைந்தன. உங்கள் தீர்வு சிறப்பான செயல்திறன் கொண்டது.`;
  } else if (score >= 50) {
    jarvisFeedback = `Good effort. Passed ${passedCount}/${challenge.testCases.length} test cases (${score}% score). Please review edge-case inputs (e.g. empty lists, negative boundaries, or duplicate keys).`;
    tamilFeedback = `நன்றாக செய்துள்ளீர்கள். ${passedCount}/${challenge.testCases.length} சோதனைகள் தேர்ச்சி பெற்றுள்ளன (${score}%). தீவிர எல்லை நிகழ்வுகளை (Edge Cases) சரிபார்க்கவும்.`;
  } else {
    jarvisFeedback = `Solution encountered failures on ${challenge.testCases.length - passedCount} test cases. Recommend checking logic flow or input parsing.`;
    tamilFeedback = `தீர்வில் ${challenge.testCases.length - passedCount} சோதனைகள் தோல்வியடைந்துள்ளன. லாஜிக் அல்லது இன்புட் வாசிப்பை சரிபார்க்கவும்.`;
  }

  return {
    score,
    totalTests: challenge.testCases.length,
    passed: passedCount,
    failed: challenge.testCases.length - passedCount,
    executionTime: parseFloat(totalTime.toFixed(3)),
    memoryMb: maxMemory,
    testResults,
    jarvisFeedback,
    tamilFeedback,
  };
}

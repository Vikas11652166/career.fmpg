const DEPARTMENTS = {
    GENERAL_MANAGEMENT: 'General Management/Administration',
    MARKETING: 'Marketing',
    DESIGN: 'Design',
    HR: 'HR',
    SALES: 'Sales',
    IT: 'IT',
    DATA_SCIENCE: 'Data Science',
    DEVELOPMENT: 'Development',
    OPERATIONS: 'Operations'
};

const POSITION_LEVELS = {
    JUNIOR: 'Junior',
    SENIOR: 'Senior',
    LEAD: 'Lead',
    MANAGER: 'Manager',
    DIRECTOR: 'Director'
};

const DEPARTMENT_POSITIONS = {
    [DEPARTMENTS.DEVELOPMENT]: [
        'Frontend Developer',
        'Backend Developer',
        'Full Stack Developer',
        'Mobile App Developer',
        'QA Engineer',
        'DevOps Engineer'
    ],
    [DEPARTMENTS.DESIGN]: [
        'UI/UX Designer',
        'Graphic Designer',
        'Product Designer',
        'Motion Designer'
    ],
    [DEPARTMENTS.HR]: [
        'HR Generalist',
        'Technical Recruiter',
        'HR Manager',
        'Talent Acquisition Specialist'
    ],
    [DEPARTMENTS.MARKETING]: [
        'Digital Marketer',
        'Content Writer',
        'SEO Specialist',
        'Social Media Manager'
    ],
    [DEPARTMENTS.IT]: [
        'System Administrator',
        'Network Engineer',
        'IT Support Specialist',
        'Security Analyst'
    ],
    [DEPARTMENTS.SALES]: [
        'Business Development Executive',
        'Account Manager',
        'Sales Representative'
    ],
    [DEPARTMENTS.DATA_SCIENCE]: [
        'Data Analyst',
        'Machine Learning Engineer',
        'Data Scientist'
    ],
    [DEPARTMENTS.OPERATIONS]: [
        'Operations Manager',
        'Project Manager',
        'Business Analyst'
    ],
    [DEPARTMENTS.GENERAL_MANAGEMENT]: [
        'Administrative Assistant',
        'Office Manager',
        'Executive Assistant'
    ]
};

const ROLES = {
    USER: 'user',
    EMPLOYEE: 'employee',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super-admin'
};

const STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    FORMER: 'former',
    SUSPENDED: 'suspended'
};

module.exports = {
    DEPARTMENTS,
    POSITION_LEVELS,
    DEPARTMENT_POSITIONS,
    ROLES,
    STATUS
};

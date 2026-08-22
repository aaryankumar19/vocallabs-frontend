export interface Owner {
  name: string;
  avatar: string;
  role: string;
  initials: string;
}

export interface ActivityItem {
  id: string;
  type: "ai" | "progress" | "attention" | "user";
  title: string;
  description: string;
  timestamp: string;
  user?: string;
}

export interface Commitment {
  id: string;
  title: string;
  description: string;
  meetingId: string;
  meetingTitle: string;
  owner: Owner;
  deadline: string;
  deadlineDate: string;
  status: "Likely Completed" | "In Progress" | "Pending" | "At Risk" | "Needs Review";
  confidence: number;
  updatedAt: string;
  category: "Engineering" | "Product" | "Design" | "Operations" | "Security";
  evidence: {
    text: string;
    verified: boolean;
    source?: string;
  }[];
  activityHistory: ActivityItem[];
}

export interface Participant {
  name: string;
  avatar: string;
  initials: string;
  role: string;
}

export interface TranscriptLine {
  id: string;
  speaker: string;
  avatar: string;
  time: string;
  text: string;
  commitmentDetected?: {
    title: string;
    owner: string;
    deadline: string;
    confidence: number;
  };
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  duration: string;
  participants: Participant[];
  commitmentsCount: number;
  decisionsCount: number;
  summary: string;
  keyTakeaways: string[];
  decisions: {
    id: string;
    text: string;
    decidedBy: string;
    impact: "High" | "Medium" | "Standard";
  }[];
  transcript: TranscriptLine[];
}

export interface MetricData {
  activeCommitments: { count: number; change: string; isPositive: boolean };
  dueSoon: { count: number; subtext: string };
  completed: { count: number; rate: string };
  needsAttention: { count: number; subtext: string };
}

export interface FeedActivity {
  id: string;
  type: "ai" | "user" | "commitment" | "deadline" | "review";
  title: string;
  description: string;
  timestamp: string;
  sourceMeeting?: string;
  owner?: Owner;
  badge?: string;
}

export const METRICS_DATA: MetricData = {
  activeCommitments: { count: 24, change: "+12% this week", isPositive: true },
  dueSoon: { count: 7, subtext: "3 due today" },
  completed: { count: 18, rate: "75% completion rate" },
  needsAttention: { count: 3, subtext: "Requires review" },
};

export const INITIAL_COMMITMENTS: Commitment[] = [
  {
    id: "comm-1",
    title: "Fix authentication issue & token refresh flow",
    description:
      "Resolve the token expiration deadlock on Safari and ensure session persistence across subdomains.",
    meetingId: "meet-1",
    meetingTitle: "Engineering Sync",
    owner: {
      name: "Aaryan",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      role: "Lead Backend Engineer",
      initials: "AA",
    },
    deadline: "Today",
    deadlineDate: "Today at 5:00 PM",
    status: "Likely Completed",
    confidence: 94,
    updatedAt: "2m ago",
    category: "Engineering",
    evidence: [
      {
        text: "Related work found in PR #142 (auth-session-refactor)",
        verified: true,
        source: "GitHub Integration",
      },
      {
        text: "Authentication middleware test suite passed (24/24 tests)",
        verified: true,
        source: "CI/CD Pipeline",
      },
      {
        text: "Safari cookie partition headers applied and verified",
        verified: true,
        source: "Commit 9b8f2d",
      },
      {
        text: "Work verified completed by AI follow-through agent",
        verified: true,
        source: "AI Agent",
      },
    ],
    activityHistory: [
      {
        id: "act-1",
        type: "ai",
        title: "AI Detected PR Merge",
        description: "Merged PR #142 into staging branch with passing tests.",
        timestamp: "2m ago",
      },
      {
        id: "act-2",
        type: "progress",
        title: "Code Pushed",
        description: "Pushed fix for SameSite cookie attributes.",
        timestamp: "24m ago",
      },
      {
        id: "act-3",
        type: "user",
        title: "Status Updated",
        description: "Aaryan updated task status to In Verification.",
        timestamp: "1h ago",
        user: "Aaryan",
      },
      {
        id: "act-4",
        type: "ai",
        title: "Commitment Extracted",
        description: "Captured during Engineering Sync meeting with 96% detection confidence.",
        timestamp: "3h ago",
      },
    ],
  },
  {
    id: "comm-2",
    title: "Update API documentation & OpenAPI schema",
    description: "Reflect v2 endpoints for webhooks and audio extraction streaming protocols.",
    meetingId: "meet-2",
    meetingTitle: "Product Roadmap Q3",
    owner: {
      name: "Rahul",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      role: "API Platform Lead",
      initials: "RS",
    },
    deadline: "Tomorrow",
    deadlineDate: "Tomorrow at 12:00 PM",
    status: "In Progress",
    confidence: 82,
    updatedAt: "14m ago",
    category: "Product",
    evidence: [
      {
        text: "Draft OpenAPI schema updated in docs/v2-spec.yaml",
        verified: true,
        source: "Repository",
      },
      {
        text: "Postman collection generated for external partner testing",
        verified: true,
        source: "Docs Engine",
      },
      {
        text: "Pending final review from integration leads",
        verified: false,
        source: "Pending Action",
      },
    ],
    activityHistory: [
      {
        id: "act-201",
        type: "progress",
        title: "Schema Updated",
        description: "Added streaming endpoints schema definitions.",
        timestamp: "14m ago",
      },
      {
        id: "act-202",
        type: "ai",
        title: "Docs Sync Ping",
        description: "AI Agent pinged Rahul on Slack regarding endpoint diff.",
        timestamp: "2h ago",
      },
      {
        id: "act-203",
        type: "ai",
        title: "Commitment Extracted",
        description: "Extracted from Product Roadmap Q3 call.",
        timestamp: "Yesterday",
      },
    ],
  },
  {
    id: "comm-3",
    title: "Prepare deployment infrastructure & health telemetry",
    description:
      "Scale Kubernetes worker nodes and configure Datadog synthetic monitors for audio processing workers.",
    meetingId: "meet-1",
    meetingTitle: "Engineering Sync",
    owner: {
      name: "Aaryan",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      role: "DevOps & Cloud Infra",
      initials: "AA",
    },
    deadline: "Friday",
    deadlineDate: "Friday at 6:00 PM",
    status: "At Risk",
    confidence: 31,
    updatedAt: "1h ago",
    category: "Engineering",
    evidence: [
      {
        text: "Terraform cluster plan failed due to quota limit on us-east-1",
        verified: false,
        source: "AWS CloudWatch",
      },
      {
        text: "No commit activity in infrastructure repo for 18 hours",
        verified: false,
        source: "GitHub Activity",
      },
      {
        text: "AI Agent flagged bottleneck: requires AWS quota increase approval",
        verified: true,
        source: "Risk Analyzer",
      },
    ],
    activityHistory: [
      {
        id: "act-301",
        type: "attention",
        title: "Risk Alert Triggered",
        description: "AI detected quota blocker and notified channel #devops-alerts.",
        timestamp: "1h ago",
      },
      {
        id: "act-302",
        type: "ai",
        title: "Deadline Approaching",
        description: "Infrastructure deploy target is in 48 hours.",
        timestamp: "5h ago",
      },
      {
        id: "act-303",
        type: "ai",
        title: "Commitment Extracted",
        description: "Committed in Engineering Sync: 'We will deploy version 2 once that is done'.",
        timestamp: "Yesterday",
      },
    ],
  },
  {
    id: "comm-4",
    title: "Client SSO onboarding & SAML 2.0 provisioning",
    description:
      "Configure Okta/Azure AD enterprise single sign-on metadata exchange for beta enterprise cohort.",
    meetingId: "meet-3",
    meetingTitle: "Client Onboarding & Enterprise Sync",
    owner: {
      name: "Priya",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      role: "Solutions Architect",
      initials: "PM",
    },
    deadline: "In 3 days",
    deadlineDate: "Aug 24 at 3:00 PM",
    status: "Needs Review",
    confidence: 65,
    updatedAt: "3h ago",
    category: "Security",
    evidence: [
      {
        text: "Okta metadata XML received from client security team",
        verified: true,
        source: "Customer Support Portal",
      },
      {
        text: "SSO assertion callback endpoints configured",
        verified: true,
        source: "Auth Service",
      },
      {
        text: "Awaiting client security officer sign-off on test claim",
        verified: false,
        source: "Client Pending",
      },
    ],
    activityHistory: [
      {
        id: "act-401",
        type: "attention",
        title: "Review Requested",
        description: "Priya requested review on SAML claim mapping config.",
        timestamp: "3h ago",
      },
      {
        id: "act-402",
        type: "progress",
        title: "Configuration Uploaded",
        description: "Metadata XML uploaded to stage.",
        timestamp: "6h ago",
      },
    ],
  },
  {
    id: "comm-5",
    title: "Database index optimization for transcript embeddings",
    description:
      "Implement pgvector HNSW indexing on meeting chunks to keep search latency under 50ms.",
    meetingId: "meet-4",
    meetingTitle: "Architecture & Performance Review",
    owner: {
      name: "Vikram",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      role: "Database Architect",
      initials: "VS",
    },
    deadline: "Next Monday",
    deadlineDate: "Aug 27 at 10:00 AM",
    status: "In Progress",
    confidence: 88,
    updatedAt: "5h ago",
    category: "Engineering",
    evidence: [
      {
        text: "Index migration script tested on 2M synthetic transcript vector embeddings",
        verified: true,
        source: "Staging DB",
      },
      {
        text: "Vector retrieval query latency dropped from 210ms to 32ms",
        verified: true,
        source: "Benchmark Suite",
      },
    ],
    activityHistory: [
      {
        id: "act-501",
        type: "progress",
        title: "Benchmark Passed",
        description: "Latency benchmarks confirmed 85% speedup.",
        timestamp: "5h ago",
      },
      {
        id: "act-502",
        type: "ai",
        title: "Commitment Extracted",
        description: "Assigned in Architecture Sync.",
        timestamp: "2 days ago",
      },
    ],
  },
  {
    id: "comm-6",
    title: "Design dark command center UI kit & motion specs",
    description:
      "Finalize glassmorphic component tokens, micro-interactions, and high-fidelity prototype flows.",
    meetingId: "meet-5",
    meetingTitle: "Design Sprint & UI System",
    owner: {
      name: "Elena",
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      role: "Principal Product Designer",
      initials: "ER",
    },
    deadline: "Tomorrow",
    deadlineDate: "Tomorrow at 4:00 PM",
    status: "Likely Completed",
    confidence: 96,
    updatedAt: "1h ago",
    category: "Design",
    evidence: [
      {
        text: "Figma tokens exported to CSS theme configuration",
        verified: true,
        source: "Figma Plugin",
      },
      {
        text: "Interactive prototype validated with 5 internal engineers",
        verified: true,
        source: "Usability Testing",
      },
      {
        text: "All iconography and kinetic motion specs published",
        verified: true,
        source: "Design System Repo",
      },
    ],
    activityHistory: [
      {
        id: "act-601",
        type: "ai",
        title: "Tokens Exported",
        description: "Design token sync verified by frontend builder.",
        timestamp: "1h ago",
      },
      {
        id: "act-602",
        type: "progress",
        title: "Figma File Updated",
        description: "Elena published v2.4 component library.",
        timestamp: "4h ago",
      },
    ],
  },
];

export const INITIAL_MEETINGS: Meeting[] = [
  {
    id: "meet-1",
    title: "Engineering Sync",
    date: "Today · 10:00 AM",
    duration: "42 min",
    participants: [
      {
        name: "Aaryan",
        avatar:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        initials: "AA",
        role: "Lead Backend",
      },
      {
        name: "Rahul",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        initials: "RS",
        role: "API Lead",
      },
      {
        name: "Priya",
        avatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
        initials: "PM",
        role: "Solutions Arch",
      },
      {
        name: "Elena",
        avatar:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
        initials: "ER",
        role: "Design Lead",
      },
      {
        name: "Vikram",
        avatar:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        initials: "VS",
        role: "DB Engineer",
      },
      {
        name: "Sarah",
        avatar:
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
        initials: "SK",
        role: "PM",
      },
    ],
    commitmentsCount: 8,
    decisionsCount: 3,
    summary:
      "The engineering team aligned on release blockers for Version 2.0. Aaryan took ownership of the Safari authentication token refresh deadlock, while Rahul committed to updating OpenAPI specifications for downstream clients. Infrastructure deployment was scheduled for Friday.",
    keyTakeaways: [
      "Safari authentication fix is priority P0 for today's deployment window.",
      "API documentation must align with newly added webhook endpoints.",
      "Deployment target locked for Friday 6:00 PM UTC.",
    ],
    decisions: [
      {
        id: "dec-1",
        text: "Switch auth session cookies to Partitioned SameSite=None for Safari compliance.",
        decidedBy: "Aaryan",
        impact: "High",
      },
      {
        id: "dec-2",
        text: "Deprecate v1 webhook payloads in favor of v2 streaming event format.",
        decidedBy: "Rahul",
        impact: "Medium",
      },
      {
        id: "dec-3",
        text: "Lock code freeze for Friday v2 deployment on Thursday 11:59 PM.",
        decidedBy: "Sarah",
        impact: "Standard",
      },
    ],
    transcript: [
      {
        id: "tr-1",
        speaker: "Sarah (PM)",
        avatar:
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
        time: "02:15",
        text: "Let's review the critical path for the v2 launch. Aaryan, where do we stand with the token expiration bug?",
      },
      {
        id: "tr-2",
        speaker: "Aaryan",
        avatar:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        time: "02:40",
        text: "I investigated the Safari storage partitioning issue this morning. I'll fix the authentication issue and token refresh flow by today before 5 PM.",
        commitmentDetected: {
          title: "Fix authentication issue & token refresh flow",
          owner: "Aaryan",
          deadline: "Today (5:00 PM)",
          confidence: 96,
        },
      },
      {
        id: "tr-3",
        speaker: "Rahul",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        time: "05:12",
        text: "On the platform side, I'll update the API documentation and OpenAPI schema tomorrow morning so integrations don't break.",
        commitmentDetected: {
          title: "Update API documentation & OpenAPI schema",
          owner: "Rahul",
          deadline: "Tomorrow (12:00 PM)",
          confidence: 92,
        },
      },
      {
        id: "tr-4",
        speaker: "Aaryan",
        avatar:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        time: "08:30",
        text: "Sounds great. We'll prepare the deployment infrastructure and deploy version 2 on Friday once all tests are passing.",
        commitmentDetected: {
          title: "Prepare deployment infrastructure & health telemetry",
          owner: "Aaryan",
          deadline: "Friday",
          confidence: 89,
        },
      },
      {
        id: "tr-5",
        speaker: "Elena",
        avatar:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
        time: "12:10",
        text: "The dark command center UI kit is ready in Figma. I will publish the final motion tokens and CSS variables by tomorrow afternoon.",
        commitmentDetected: {
          title: "Design dark command center UI kit & motion specs",
          owner: "Elena",
          deadline: "Tomorrow (4:00 PM)",
          confidence: 95,
        },
      },
    ],
  },
  {
    id: "meet-2",
    title: "Product Roadmap Q3",
    date: "Yesterday · 2:00 PM",
    duration: "55 min",
    participants: [
      {
        name: "Rahul",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        initials: "RS",
        role: "API Lead",
      },
      {
        name: "Sarah",
        avatar:
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
        initials: "SK",
        role: "PM",
      },
      {
        name: "Priya",
        avatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
        initials: "PM",
        role: "Solutions Arch",
      },
      {
        name: "Elena",
        avatar:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
        initials: "ER",
        role: "Design Lead",
      },
    ],
    commitmentsCount: 5,
    decisionsCount: 2,
    summary:
      "Detailed prioritization for enterprise collaboration features, automated follow-through agents, and Slack webhook listeners.",
    keyTakeaways: [
      "Prioritize autonomous follow-through bots over static email summaries.",
      "Expand enterprise tenant isolations for SOC2 compliance.",
    ],
    decisions: [
      {
        id: "dec-21",
        text: "Standardize on WebSocket real-time updates for meeting room transcriptions.",
        decidedBy: "Sarah",
        impact: "High",
      },
    ],
    transcript: [],
  },
  {
    id: "meet-3",
    title: "Client Onboarding & Enterprise Sync",
    date: "2 days ago · 11:30 AM",
    duration: "35 min",
    participants: [
      {
        name: "Priya",
        avatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
        initials: "PM",
        role: "Solutions Arch",
      },
      {
        name: "Vikram",
        avatar:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        initials: "VS",
        role: "DB Engineer",
      },
    ],
    commitmentsCount: 4,
    decisionsCount: 1,
    summary:
      "Reviewed SAML 2.0 SSO federation and dedicated cloud tenant requirements for Fortune 500 pilots.",
    keyTakeaways: [
      "Client requires Okta OIDC metadata setup by Thursday.",
      "Audit logging must be queryable via external syslog.",
    ],
    decisions: [
      {
        id: "dec-31",
        text: "Provision isolated RDS instance with customer-managed KMS key.",
        decidedBy: "Priya",
        impact: "High",
      },
    ],
    transcript: [],
  },
  {
    id: "meet-4",
    title: "Architecture & Performance Review",
    date: "3 days ago · 4:00 PM",
    duration: "48 min",
    participants: [
      {
        name: "Vikram",
        avatar:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
        initials: "VS",
        role: "DB Engineer",
      },
      {
        name: "Aaryan",
        avatar:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        initials: "AA",
        role: "Lead Backend",
      },
    ],
    commitmentsCount: 4,
    decisionsCount: 2,
    summary:
      "Vector database indexing strategy benchmarks and semantic search throughput optimization.",
    keyTakeaways: ["HNSW index replaces IVFFlat to reduce latency under heavy concurrency."],
    decisions: [
      {
        id: "dec-41",
        text: "Adopt pgvector with m=16, ef_construction=64 parameters.",
        decidedBy: "Vikram",
        impact: "Medium",
      },
    ],
    transcript: [],
  },
];

export const INITIAL_ACTIVITIES: FeedActivity[] = [
  {
    id: "act-f1",
    type: "ai",
    title: "AI Detected Commitment Completion",
    description:
      "Verified PR #142 addresses token expiration flow. Updated 'Fix authentication issue' to Likely Completed (94% confidence).",
    timestamp: "2 minutes ago",
    sourceMeeting: "Engineering Sync",
    badge: "AI Autonomous",
  },
  {
    id: "act-f2",
    type: "deadline",
    title: "Deadline Approaching Alert",
    description:
      "'Fix authentication issue & token refresh flow' is due today at 5:00 PM. Verification on track.",
    timestamp: "18 minutes ago",
    badge: "Due Today",
  },
  {
    id: "act-f3",
    type: "commitment",
    title: "Commitment Status Updated",
    description:
      "Rahul updated 'Update API documentation' progress with new v2 schema pull request.",
    timestamp: "45 minutes ago",
    sourceMeeting: "Product Roadmap Q3",
    badge: "In Progress",
  },
  {
    id: "act-f4",
    type: "ai",
    title: "Autonomous Repo Sync",
    description:
      "AI Agent scanned 6 recent commits across repositories and correlated 3 commitments automatically.",
    timestamp: "1 hour ago",
    badge: "AI Agent",
  },
  {
    id: "act-f5",
    type: "review",
    title: "Review Requested",
    description: "Priya requested lead review for 'Client SSO onboarding & SAML 2.0 provisioning'.",
    timestamp: "3 hours ago",
    sourceMeeting: "Client Onboarding & Enterprise Sync",
    badge: "Needs Review",
  },
  {
    id: "act-f6",
    type: "ai",
    title: "New Meeting Processed",
    description:
      "Engineering Sync (42 min) analyzed: 8 commitments extracted, 3 key decisions logged, 6 owners assigned.",
    timestamp: "3.5 hours ago",
    sourceMeeting: "Engineering Sync",
    badge: "Extraction Complete",
  },
];

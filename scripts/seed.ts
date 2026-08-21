/**
 * CPP Portal seed script.
 * Run with: npx tsx scripts/seed.ts
 * Idempotent: skips if members already exist.
 */
import "dotenv/config";
import { readFileSync } from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { db } from "../src/db/index";
import {
  members,
  positions,
  applications,
  appointments,
  applicationEvents,
  notifications,
  emailLog,
  auditLogs,
  constitutionArticles,
} from "../src/db/schema";

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();

function daysAgo(n: number): Date {
  return new Date(now - n * DAY);
}
function daysAhead(n: number): Date {
  return new Date(now + n * DAY);
}

/* ------------------------------------------------------------------ */
/* Constitution data                                                   */
/* ------------------------------------------------------------------ */
interface ArticleDef {
  no: string;
  title: string;
  content: string;
}
interface ChapterDef {
  no: number;
  title: string;
  articles: ArticleDef[];
}
const constitutionData = JSON.parse(
  readFileSync(path.join(process.cwd(), "scripts", "constitution-data.json"), "utf8")
) as { chapters: ChapterDef[] };

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */
async function main() {
  const existing = await db.select({ id: members.id }).from(members).limit(1);
  if (existing.length > 0) {
    console.log("Seed skipped: members already exist.");
    return;
  }

  console.log("Seeding constitution articles…");
  let sort = 0;
  for (const chapter of constitutionData.chapters) {
    for (const article of chapter.articles) {
      await db.insert(constitutionArticles).values({
        chapterNo: chapter.no,
        chapterTitle: chapter.title,
        articleNo: article.no,
        title: article.title,
        content: article.content,
        sortOrder: sort++,
      });
    }
  }

  console.log("Seeding positions…");
  const positionRows: Record<string, { id: number }> = {};

  const nationalCore: Array<{
    name: string;
    rank: number;
    wing: string;
    method: string;
    description: string;
    responsibilities: string[];
    eligibility: string[];
    term: string;
    ref: string;
    vacancies: number;
  }> = [
    {
      name: "National President",
      rank: 1,
      wing: "Executive",
      method: "electoral_college",
      description:
        "The foremost constitutional office of the Party. The National President is selected through an electoral college consisting of the sitting CPP Members of Parliament and the 35 National Secretaries, as provided in the Constitution.",
      responsibilities: [
        "Lead the Party in accordance with the Constitution.",
        "Exercise only the responsibilities defined for the office.",
        "Convene and preside over the constitutional bodies as provided.",
        "Maintain continuous public accountability of the office.",
      ],
      eligibility: [
        "Must be a verified, active member of the CPP.",
        "Must be selected through the electoral college of sitting CPP MPs and the 35 National Secretaries.",
        "Must agree to follow the CPP Constitution and internal rules.",
      ],
      term: "As prescribed by the Constitution.",
      ref: "Chapter 5, Article 5.1",
      vacancies: 1,
    },
    {
      name: "National Chairperson",
      rank: 2,
      wing: "Executive",
      method: "joint_appointment",
      description:
        "The National Chairperson is appointed through a constitutional process requiring consensus between the National President and the National Party Leader, with the fallback mechanism specified in the Constitution.",
      responsibilities: [
        "Preside over meetings and proceedings as provided in the Constitution.",
        "Safeguard constitutional procedure in the proceedings of the Party.",
        "Act only within the responsibility defined for the office.",
      ],
      eligibility: [
        "Must be a verified, active member of the CPP.",
        "Appointment requires consensus between the National President and the National Party Leader; the constitutional fallback mechanism applies otherwise.",
        "Must agree to follow the CPP Constitution and internal rules.",
      ],
      term: "As prescribed by the Constitution.",
      ref: "Chapter 5, Article 5.2",
      vacancies: 1,
    },
    {
      name: "National Party Leader",
      rank: 3,
      wing: "Executive",
      method: "election",
      description:
        "The National Party Leader is elected by a majority vote of the sitting CPP Members of Parliament. Before the Party has sitting MPs, the provisional founder-appointed arrangement specified in the Constitution applies.",
      responsibilities: [
        "Provide political leadership of the Party.",
        "Lead the Party in elections and public affairs as provided in the Constitution.",
        "Exercise only the responsibility defined for the office.",
      ],
      eligibility: [
        "Must be a verified, active member of the CPP.",
        "Elected by a majority vote of the sitting CPP MPs; the provisional founder-appointed arrangement applies before the Party has sitting MPs.",
        "Must agree to follow the CPP Constitution and internal rules.",
      ],
      term: "As prescribed by the Constitution.",
      ref: "Chapter 5, Article 5.3",
      vacancies: 1,
    },
    {
      name: "National Committee",
      rank: 4,
      wing: "Executive",
      method: "committee_selection",
      description:
        "The constitutional body responsible for the supervision and coordination of the affairs of the Party at the national level, in accordance with the Constitution.",
      responsibilities: [
        "Supervise and coordinate Party affairs at the national level.",
        "Ensure that the constitutional processes are followed.",
        "Maintain records enabling continuous public accountability.",
      ],
      eligibility: [
        "Must be a verified, active member of the CPP.",
        "Selected through the constitutional committee selection procedure.",
        "Must agree to follow the CPP Constitution and internal rules.",
      ],
      term: "As prescribed by the Constitution.",
      ref: "Chapter 5, Article 5.4",
      vacancies: 9,
    },
    {
      name: "National Treasurer",
      rank: 5,
      wing: "Executive",
      method: "appointment",
      description:
        "Responsible for the financial records and financial accountability of the Party, in accordance with the Constitution and the internal financial rules.",
      responsibilities: [
        "Maintain the financial records of the Party.",
        "Report financial matters to the constitutional bodies as provided.",
        "Uphold the financial accountability framework of the Constitution.",
      ],
      eligibility: [
        "Must be a verified, active member of the CPP.",
        "Appointed by the constitutional appointing authority.",
        "Must agree to follow the CPP Constitution and internal rules.",
      ],
      term: "As prescribed by the Constitution.",
      ref: "Chapter 5, Article 5.5",
      vacancies: 1,
    },
    {
      name: "State Presidents",
      rank: 6,
      wing: "Executive",
      method: "election",
      description:
        "The State Presidents lead the Party at the State Level. The state-level structure replicates the national structure where applicable.",
      responsibilities: [
        "Lead the Party in the respective state.",
        "Exercise only the responsibility defined for the office.",
        "Maintain continuous public accountability of the office.",
      ],
      eligibility: [
        "Must be a verified, active member of the CPP resident in the respective state.",
        "Elected through the state-level process as replicated from the national structure.",
        "Must agree to follow the CPP Constitution and internal rules.",
      ],
      term: "As prescribed by the Constitution.",
      ref: "Chapter 5, Article 5.6",
      vacancies: 28,
    },
  ];

  for (const p of nationalCore) {
    const rows = await db
      .insert(positions)
      .values({
        positionName: p.name,
        rank: p.rank,
        level: "national",
        wing: p.wing,
        description: p.description,
        responsibilities: p.responsibilities,
        appointmentMethod: p.method,
        eligibility: p.eligibility,
        eligibilityRules: { minAgeYears: 18, requireVerification: true, stateMatch: false },
        termInfo: p.term,
        vacancies: p.vacancies,
        vacancyStatus: "open",
        applicationDeadline: daysAhead(60),
        constitutionalReference: p.ref,
      })
      .returning({ id: positions.id, positionName: positions.positionName });
    positionRows[p.name] = rows[0]!;
  }

  const secretarySectors = [
    "Digital Assets", "Training", "Research", "Logistics", "Membership",
    "Finance", "Media & Public Relations", "Legal Affairs", "Policy & Planning",
    "Elections", "Youth Affairs", "Women's Affairs", "Minority Affairs",
    "Agriculture & Farmers", "Labour & Employment", "Education",
    "Health & Public Welfare", "Industry & Commerce", "Science & Technology",
    "Environment & Climate", "Energy", "Infrastructure", "Urban Development",
    "Rural Development", "Social Justice", "Art & Culture", "Sports",
    "International Relations", "Public Grievances", "Information Technology",
    "Data & Records", "Security & Coordination", "Volunteer Management",
    "Fundraising & Resources", "Disaster Relief",
  ];

  const secretaryIds: Record<string, number> = {};
  for (const sector of secretarySectors) {
    const name = `National Secretary — ${sector}`;
    const rows = await db
      .insert(positions)
      .values({
        positionName: name,
        rank: 7,
        level: "national",
        wing: "Secretariat",
        description: `National Secretary covering the ${sector} functional operational sector of the Party, as specified among the 35 National Secretaries in the Constitution.`,
        responsibilities: [
          `Operate the ${sector} sector of the Party.`,
          "Maintain the records of the sector and report to the constitutional bodies.",
          "Participate in the electoral college for the selection of the National President.",
        ],
        appointmentMethod: "appointment",
        eligibility: [
          "Must be a verified, active member of the CPP.",
          "Appointed by the constitutional appointing authority for the sector.",
          "Must agree to follow the CPP Constitution and internal rules.",
        ],
        eligibilityRules: { minAgeYears: 18, requireVerification: true, stateMatch: false },
        termInfo: "As prescribed by the Constitution.",
        vacancies: 1,
        vacancyStatus: "open",
        applicationDeadline: daysAhead(45),
        constitutionalReference: "Chapter 6, Article 6.1",
      })
      .returning({ id: positions.id, positionName: positions.positionName });
    secretaryIds[sector] = rows[0]!.id;
  }

  const statePositions: Array<{
    name: string;
    rank: number;
    method: string;
    description: string;
  }> = [
    {
      name: "State President",
      rank: 10,
      method: "election",
      description:
        "Leads the Party in the state. The state-level structure replicates the national structure where applicable.",
    },
    {
      name: "State Chairperson",
      rank: 11,
      method: "joint_appointment",
      description:
        "Performs, at the state level, the functions corresponding to the National Chairperson.",
    },
    {
      name: "State Secretary",
      rank: 12,
      method: "appointment",
      description:
        "Responsible for the organizational and administrative work of the Party in the state.",
    },
    {
      name: "State Treasurer",
      rank: 13,
      method: "appointment",
      description:
        "Responsible for the financial records of the Party in the state.",
    },
    {
      name: "State Committee",
      rank: 14,
      method: "committee_selection",
      description:
        "Performs, at the state level, the coordination functions corresponding to the National Committee.",
    },
  ];

  for (const p of statePositions) {
    const rows = await db
      .insert(positions)
      .values({
        positionName: p.name,
        rank: p.rank,
        level: "state",
        wing: "State Executive",
        state: null,
        description: `${p.description} One office per state.`,
        responsibilities: [
          "Exercise only the responsibility defined for the office in the Constitution.",
          "Maintain records enabling continuous public accountability.",
        ],
        appointmentMethod: p.method,
        eligibility: [
          "Must be a verified, active member of the CPP resident in the respective state.",
          "Selected through the process replicated from the corresponding national provision.",
          "Must agree to follow the CPP Constitution and internal rules.",
        ],
        eligibilityRules: { minAgeYears: 18, requireVerification: true, stateMatch: true },
        termInfo: "As prescribed by the Constitution.",
        vacancies: 1,
        vacancyStatus: "open",
        applicationDeadline: daysAhead(60),
        constitutionalReference: "Chapter 7",
      })
      .returning({ id: positions.id, positionName: positions.positionName });
    positionRows[p.name] = rows[0]!;
  }

  console.log("Seeding members…");
  const adminHash = await bcrypt.hash("Admin@2026", 12);
  const memberHash = await bcrypt.hash("Member@2026", 12);

  const adminRow = await db
    .insert(members)
    .values({
      memberId: "CPP-2026-00001",
      name: "CPP Administration",
      email: "admin@cpp.org",
      phone: "+91 90000 00001",
      dateOfBirth: "1980-01-01",
      gender: "other",
      state: "Delhi",
      district: "New Delhi",
      constituency: "New Delhi",
      address: "CPP National Office, New Delhi",
      education: "Administration",
      profession: "Party Administration",
      skills: "administration, governance",
      previousExperience: "Party administration.",
      passwordHash: adminHash,
      role: "super_admin",
      emailVerified: true,
      verificationStatus: "verified",
      membershipStatus: "active",
      createdAt: daysAgo(120),
      updatedAt: daysAgo(120),
    })
    .returning({ id: members.id });

  await db.insert(members).values([
    {
      memberId: "CPP-2026-00002",
      name: "Amit Verma",
      email: "national.admin@cpp.org",
      phone: "+91 90000 00002",
      dateOfBirth: "1978-06-15",
      gender: "male",
      state: "Maharashtra",
      district: "Mumbai",
      constituency: "Mumbai South",
      address: "Mumbai",
      education: "M.Com",
      profession: "Administrator",
      skills: "administration",
      previousExperience: "Organizational administration.",
      passwordHash: adminHash,
      role: "national_admin",
      emailVerified: true,
      verificationStatus: "verified",
      membershipStatus: "active",
      createdAt: daysAgo(100),
      updatedAt: daysAgo(100),
    },
    {
      memberId: "CPP-2026-00003",
      name: "Rajesh Iyer",
      email: "authority@cpp.org",
      phone: "+91 90000 00003",
      dateOfBirth: "1972-03-22",
      gender: "male",
      state: "Tamil Nadu",
      district: "Chennai",
      constituency: "Chennai Central",
      address: "Chennai",
      education: "M.A. (Political Science)",
      profession: "Constitutional Officer",
      skills: "governance, oversight",
      previousExperience: "Constitutional appointment functions.",
      passwordHash: adminHash,
      role: "appointment_authority",
      emailVerified: true,
      verificationStatus: "verified",
      membershipStatus: "active",
      createdAt: daysAgo(90),
      updatedAt: daysAgo(90),
    },
    {
      memberId: "CPP-2026-00004",
      name: "Sunita Nair",
      email: "state.admin@cpp.org",
      phone: "+91 90000 00004",
      dateOfBirth: "1982-11-02",
      gender: "female",
      state: "Kerala",
      district: "Thiruvananthapuram",
      constituency: "Thiruvananthapuram",
      address: "Thiruvananthapuram",
      education: "B.A.",
      profession: "State Administrator",
      skills: "coordination",
      previousExperience: "State coordination.",
      passwordHash: adminHash,
      role: "state_admin",
      emailVerified: true,
      verificationStatus: "verified",
      membershipStatus: "active",
      createdAt: daysAgo(80),
      updatedAt: daysAgo(80),
    },
    {
      memberId: "CPP-2026-00005",
      name: "Ravi Kumar",
      email: "member@cpp.org",
      phone: "+91 98765 43210",
      dateOfBirth: "1990-05-14",
      gender: "male",
      state: "Delhi",
      district: "New Delhi",
      constituency: "New Delhi",
      address: "D-12, Lajpat Nagar, New Delhi",
      education: "B.Tech (Computer Science)",
      profession: "Software Engineer",
      skills: "digital systems, community organizing, public speaking",
      previousExperience:
        "Volunteer coordinator in a civic association; managed digital campaigns for three community drives.",
      passwordHash: memberHash,
      role: "member",
      emailVerified: true,
      verificationStatus: "verified",
      membershipStatus: "active",
      createdAt: daysAgo(60),
      updatedAt: daysAgo(60),
    },
    {
      memberId: "CPP-2026-00006",
      name: "Priya Sharma",
      email: "priya@cpp.org",
      phone: "+91 91234 56789",
      dateOfBirth: "1993-09-28",
      gender: "female",
      state: "Rajasthan",
      district: "Jaipur",
      constituency: "Jaipur",
      address: "14, Civil Lines, Jaipur",
      education: "M.A. (Sociology)",
      profession: "Researcher",
      skills: "research, field surveys, documentation",
      previousExperience: "Research assistant with two policy research organizations.",
      passwordHash: memberHash,
      role: "member",
      emailVerified: true,
      verificationStatus: "verified",
      membershipStatus: "active",
      createdAt: daysAgo(45),
      updatedAt: daysAgo(45),
    },
    {
      memberId: "CPP-2026-00007",
      name: "Mohammed Asif",
      email: "pending@cpp.org",
      phone: "+91 99887 76655",
      dateOfBirth: "1988-01-30",
      gender: "male",
      state: "Uttar Pradesh",
      district: "Lucknow",
      constituency: "Lucknow Central",
      address: "Lucknow",
      education: "B.Com",
      profession: "Accountant",
      skills: "accounts, record keeping",
      previousExperience: "Treasurer of a local sports club.",
      passwordHash: memberHash,
      role: "member",
      emailVerified: false,
      verificationStatus: "pending",
      membershipStatus: "active",
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
  ]);

  console.log("Seeding applications…");

  async function insertApplication(input: {
    applicationId: string;
    memberId: number;
    positionId: number;
    status: string;
    submittedDaysAgo: number;
    answers: Record<string, string>;
  }) {
    const rows = await db
      .insert(applications)
      .values({
        applicationId: input.applicationId,
        memberId: input.memberId,
        positionId: input.positionId,
        status: input.status,
        answers: input.answers,
        documents: [],
        submittedAt: daysAgo(input.submittedDaysAgo),
        reviewedAt: input.status !== "submitted" ? daysAgo(input.submittedDaysAgo - 2) : null,
        decisionAt: ["appointed", "rejected", "selected"].includes(input.status)
          ? daysAgo(input.submittedDaysAgo - 8)
          : null,
      })
      .returning({ id: applications.id });
    return rows[0]!.id;
  }

  const raviAnswers = {
    state: "Delhi",
    district: "New Delhi",
    education: "B.Tech (Computer Science)",
    professionalExperience:
      "Eight years as a software engineer, leading product teams and managing digital infrastructure projects.",
    organizationalExperience:
      "Volunteer coordinator in a civic association; managed digital campaigns for three community drives.",
    relevantSkills: "digital systems, community organizing, public speaking",
    leadershipExperience:
      "Led a 40-member volunteer team for a city-wide civic campaign; organized two state-level training workshops.",
    motivation:
      "I want to serve the party and the public through defined responsibility and continuous public accountability, contributing to the operational excellence of this sector.",
  };

  const app1Id = await insertApplication({
    applicationId: "CPP-2026-000001",
    memberId: 5,
    positionId: secretaryIds["Digital Assets"]!,
    status: "under_review",
    submittedDaysAgo: 12,
    answers: raviAnswers,
  });

  const app2Id = await insertApplication({
    applicationId: "CPP-2026-000002",
    memberId: 5,
    positionId: secretaryIds["Training"]!,
    status: "appointed",
    submittedDaysAgo: 30,
    answers: raviAnswers,
  });

  const app3Id = await insertApplication({
    applicationId: "CPP-2026-000003",
    memberId: 5,
    positionId: positionRows["National Treasurer"]!.id,
    status: "rejected",
    submittedDaysAgo: 40,
    answers: raviAnswers,
  });

  const app4Id = await insertApplication({
    applicationId: "CPP-2026-000004",
    memberId: 6,
    positionId: secretaryIds["Research"]!,
    status: "verification",
    submittedDaysAgo: 10,
    answers: {
      state: "Rajasthan",
      district: "Jaipur",
      education: "M.A. (Sociology)",
      professionalExperience: "Four years of field and policy research across two organizations.",
      organizationalExperience: "Research assistant with two policy research organizations.",
      relevantSkills: "research, field surveys, documentation",
      leadershipExperience: "Coordinated field survey teams of 12 researchers.",
      motivation:
        "I want to strengthen the research base of the party so that decisions are grounded in evidence and publicly accountable.",
    },
  });

  console.log("Seeding application events…");
  const events: Array<{
    applicationId: number;
    from: string | null;
    to: string;
    actorId: number | null;
    actorName: string;
    note: string | null;
    daysAgoN: number;
  }> = [
    { applicationId: app1Id, from: null, to: "submitted", actorId: 5, actorName: "Ravi Kumar", note: "Application submitted by the member.", daysAgoN: 12 },
    { applicationId: app1Id, from: "submitted", to: "under_review", actorId: 2, actorName: "Amit Verma", note: "Application opened for administrator review.", daysAgoN: 9 },
    { applicationId: app2Id, from: null, to: "submitted", actorId: 5, actorName: "Ravi Kumar", note: "Application submitted by the member.", daysAgoN: 30 },
    { applicationId: app2Id, from: "submitted", to: "under_review", actorId: 2, actorName: "Amit Verma", note: null, daysAgoN: 27 },
    { applicationId: app2Id, from: "under_review", to: "verification", actorId: 2, actorName: "Amit Verma", note: "Identity and documents under verification.", daysAgoN: 24 },
    { applicationId: app2Id, from: "verification", to: "shortlisted", actorId: 2, actorName: "Amit Verma", note: "Strong sectoral experience.", daysAgoN: 18 },
    { applicationId: app2Id, from: "shortlisted", to: "selected", actorId: 2, actorName: "Amit Verma", note: "Selected for the Training sector.", daysAgoN: 12 },
    { applicationId: app2Id, from: "selected", to: "appointed", actorId: 3, actorName: "Rajesh Iyer", note: "Appointed by the National Party Leader. Reference CPP-2026-000001.", daysAgoN: 6 },
    { applicationId: app3Id, from: null, to: "submitted", actorId: 5, actorName: "Ravi Kumar", note: "Application submitted by the member.", daysAgoN: 40 },
    { applicationId: app3Id, from: "submitted", to: "under_review", actorId: 2, actorName: "Amit Verma", note: null, daysAgoN: 37 },
    { applicationId: app3Id, from: "under_review", to: "verification", actorId: 2, actorName: "Amit Verma", note: null, daysAgoN: 34 },
    { applicationId: app3Id, from: "verification", to: "rejected", actorId: 2, actorName: "Amit Verma", note: "Financial sector candidates require additional qualification per internal rules.", daysAgoN: 28 },
    { applicationId: app4Id, from: null, to: "submitted", actorId: 6, actorName: "Priya Sharma", note: "Application submitted by the member.", daysAgoN: 10 },
    { applicationId: app4Id, from: "submitted", to: "under_review", actorId: 2, actorName: "Amit Verma", note: null, daysAgoN: 8 },
    { applicationId: app4Id, from: "under_review", to: "verification", actorId: 2, actorName: "Amit Verma", note: "Research credentials under verification.", daysAgoN: 5 },
  ];

  for (const ev of events) {
    await db.insert(applicationEvents).values({
      applicationId: ev.applicationId,
      fromStatus: ev.from,
      toStatus: ev.to,
      actorId: ev.actorId,
      actorName: ev.actorName,
      note: ev.note,
      createdAt: daysAgo(ev.daysAgoN),
    });
  }

  console.log("Seeding emails and notifications…");
  async function insertEmail(input: {
    to: string;
    subject: string;
    body: string;
    daysAgoN: number;
    relatedType?: string;
    relatedId?: number;
  }) {
    const rows = await db
      .insert(emailLog)
      .values({
        toEmail: input.to,
        subject: input.subject,
        bodyHtml: `<div style="font-family:sans-serif;font-size:14px;line-height:1.6;color:#171717;">${input.body}</div>`,
        bodyText: input.body.replace(/<[^>]+>/g, " "),
        status: "logged",
        provider: "outbox",
        relatedType: input.relatedType ?? null,
        relatedId: input.relatedId ?? null,
        sentAt: daysAgo(input.daysAgoN),
        createdAt: daysAgo(input.daysAgoN),
      })
      .returning({ id: emailLog.id });
    return rows[0]!.id;
  }

  async function insertNotification(input: {
    memberId: number;
    type: string;
    subject: string;
    message: string;
    emailLogId: number | null;
    read: boolean;
    daysAgoN: number;
  }) {
    await db.insert(notifications).values({
      memberId: input.memberId,
      type: input.type,
      subject: input.subject,
      message: input.message,
      emailLogId: input.emailLogId,
      read: input.read,
      createdAt: daysAgo(input.daysAgoN),
    });
  }

  await insertEmail({
    to: "member@cpp.org",
    subject: "CPP Membership Registration Received",
    body: "<p>Dear <strong>Ravi Kumar</strong>,</p><p>Your registration with the Common People's Party (CPP) has been received. Your Member ID is <strong>CPP-2026-00005</strong>.</p>",
    daysAgoN: 60,
    relatedType: "member",
    relatedId: 5,
  });

  const officialEmailId = await insertEmail({
    to: "member@cpp.org",
    subject: "Official Appointment Notification — National Secretary — Training",
    body:
      "<p>Dear <strong>Ravi Kumar</strong>,</p>" +
      "<p>You have been officially appointed to <strong>National Secretary — Training</strong> (National Level).</p>" +
      "<table style='border-collapse:collapse;font-size:13px;'>" +
      "<tr><td style='padding:4px 12px;'><strong>Member Name</strong></td><td>Ravi Kumar</td></tr>" +
      "<tr><td style='padding:4px 12px;'><strong>Member ID</strong></td><td>CPP-2026-00005</td></tr>" +
      "<tr><td style='padding:4px 12px;'><strong>Position</strong></td><td>National Secretary — Training</td></tr>" +
      "<tr><td style='padding:4px 12px;'><strong>Organizational Level</strong></td><td>National Level</td></tr>" +
      "<tr><td style='padding:4px 12px;'><strong>Appointing Authority</strong></td><td>National Party Leader</td></tr>" +
      "<tr><td style='padding:4px 12px;'><strong>Reference / Application No.</strong></td><td>CPP-2026-000001 (CPP-2026-000002)</td></tr>" +
      "</table>" +
      "<p>This appointment is recorded in the official appointment register of the CPP.</p>",
    daysAgoN: 6,
    relatedType: "appointment",
    relatedId: 1,
  });

  await insertEmail({
    to: "member@cpp.org",
    subject: "Application Status Update",
    body: "<p>Your application <strong>CPP-2026-000001</strong> for National Secretary — Digital Assets is now <strong>Under Review</strong>.</p>",
    daysAgoN: 9,
    relatedType: "application",
    relatedId: app1Id,
  });

  await insertEmail({
    to: "priya@cpp.org",
    subject: "Application Submitted Successfully",
    body: "<p>Your application <strong>CPP-2026-000004</strong> for National Secretary — Research has been submitted.</p>",
    daysAgoN: 10,
    relatedType: "application",
    relatedId: app4Id,
  });

  await insertNotification({
    memberId: 5,
    type: "registration",
    subject: "CPP Membership Registration Received",
    message: "Welcome to the CPP. Your Member ID is CPP-2026-00005.",
    emailLogId: 1,
    read: true,
    daysAgoN: 60,
  });

  await insertNotification({
    memberId: 5,
    type: "appointment",
    subject: "Official Appointment Notification — National Secretary — Training",
    message:
      "You have been officially appointed to National Secretary — Training (National Level). Reference: CPP-2026-000001.",
    emailLogId: officialEmailId,
    read: false,
    daysAgoN: 6,
  });

  await insertNotification({
    memberId: 5,
    type: "application_status",
    subject: "Application Under Review — National Secretary — Digital Assets",
    message:
      "Your application CPP-2026-000001 for National Secretary — Digital Assets is now Under Review.",
    emailLogId: 3,
    read: false,
    daysAgoN: 9,
  });

  await insertNotification({
    memberId: 6,
    type: "application_submitted",
    subject: "Application submitted — National Secretary — Research",
    message:
      "Your application CPP-2026-000004 for National Secretary — Research has been submitted. Current status: Submitted.",
    emailLogId: 4,
    read: false,
    daysAgoN: 10,
  });

  console.log("Seeding appointment…");
  await db.insert(appointments).values({
    appointmentId: "CPP-APPT-2026-0001",
    referenceNumber: "CPP-2026-000001",
    applicationId: app2Id,
    memberId: 5,
    positionId: secretaryIds["Training"]!,
    appointingAuthority: "National Party Leader",
    authorityRole: "appointment_authority",
    appointmentMethod: "appointment",
    appointmentDate: daysAgo(6),
    effectiveDate: daysAhead(30),
    appointmentStatus: "confirmed",
    officialEmailId,
    createdBy: 3,
    createdAt: daysAgo(6),
  });

  console.log("Seeding audit logs…");
  await db.insert(auditLogs).values([
    {
      adminId: 1,
      adminName: "CPP Administration",
      action: "member_verified",
      targetType: "member",
      targetId: "CPP-2026-00005",
      details: { by: "CPP Administration" },
      createdAt: daysAgo(55),
    },
    {
      adminId: 1,
      adminName: "CPP Administration",
      action: "member_verified",
      targetType: "member",
      targetId: "CPP-2026-00006",
      details: { by: "CPP Administration" },
      createdAt: daysAgo(40),
    },
    {
      adminId: 2,
      adminName: "Amit Verma",
      action: "application_status_changed",
      targetType: "application",
      targetId: "CPP-2026-000002",
      details: { from: "verification", to: "shortlisted", by: "Amit Verma" },
      createdAt: daysAgo(18),
    },
    {
      adminId: 2,
      adminName: "Amit Verma",
      action: "application_status_changed",
      targetType: "application",
      targetId: "CPP-2026-000002",
      details: { from: "shortlisted", to: "selected", by: "Amit Verma" },
      createdAt: daysAgo(12),
    },
    {
      adminId: 3,
      adminName: "Rajesh Iyer",
      action: "appointment_confirmed",
      targetType: "appointment",
      targetId: "CPP-APPT-2026-0001",
      details: {
        member: "CPP-2026-00005",
        position: "National Secretary — Training",
        authority: "National Party Leader",
        method: "Appointment",
        referenceNumber: "CPP-2026-000001",
        officialEmailSent: true,
      },
      createdAt: daysAgo(6),
    },
    {
      adminId: 2,
      adminName: "Amit Verma",
      action: "application_status_changed",
      targetType: "application",
      targetId: "CPP-2026-000003",
      details: { from: "verification", to: "rejected", by: "Amit Verma" },
      createdAt: daysAgo(28),
    },
  ]);

  console.log(`Seed complete. Position ids: ${Object.keys(secretaryIds).length} secretaries + core + state.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });

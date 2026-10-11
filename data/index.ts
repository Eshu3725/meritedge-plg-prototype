import domains from "./auth/domains.json";
import users from "./auth/users.json";
import sso from "./auth/sso.json";
import assessments from "./hiring/assessments.json";
import interviews from "./hiring/interviews.json";
import jobs from "./hiring/jobs.json";
import exam from "./hiring/exam.json";
import wizards from "./hiring/wizards.json";
import navigation from "./product/navigation.json";
import landing from "./product/landing.json";
import intent from "./product/intent.json";
import milestones from "./product/milestones.json";
import tour from "./product/tour.json";
import plansFile from "./billing/plans.json";
import payments from "./billing/payments.json";
import seller from "./billing/seller.json";

/** Flat catalogue the workspace engine reads. Edit the JSON files, not this object. */
export const appData = {
  personalDomains: domains.personal,
  disposableDomains: domains.disposable,
  users,
  ssoAccounts: sso.accounts,
  ssoPerms: sso.permissions,
  assessments,
  interviews,
  sampleJds: jobs,
  examQuestions: exam.questions,
  interviewTurns: exam.turns,
  interviewVoices: exam.voices,
  interviewPhotos: exam.photos,
  assessSteps: wizards.assessment,
  interviewSteps: wizards.interview,
  appNav: navigation.items,
  pageTitles: navigation.titles,
  stepMessages: landing.steps,
  proofChips: landing.proofChips,
  intentRoles: intent.roles,
  intentVolumes: intent.volumes,
  intentProducts: intent.products,
  milestones,
  demoDuration: tour.duration,
  demoScenes: tour.scenes,
  wowTicker: tour.ticker,
  plans: plansFile.plans,
  planRows: plansFile.comparison,
  features: plansFile.features,
  payMethods: payments.methods,
  payBanks: payments.banks,
  payWallets: payments.wallets,
  payLater: payments.payLater,
  checkoutSteps: payments.checkoutSteps,
  billMails: payments.emails,
  gstSeller: seller,
};

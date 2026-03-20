export type LoanStatus = 'PendingApproval' | 'Approved' | 'Rejected' | 'Cancelled';

export interface LoanSummary {
  loanId: string;
  amount: number;
  installments: number;
  monthlyPayment: number;
  status: LoanStatus;
  requiredApprovalRole: string;
  requestedAt: string;
  loanType: LoanType;
}

export interface LoanDetail extends LoanSummary {
  clientId: string;
  interestRate: number;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  approvalHistory: LoanApprovalHistory[];
}

export interface LoanApprovalHistory {
  userId: string;
  role: string;
  decision: 'Approved' | 'Rejected';
  decisionAt: string;
  comment?: string;
}

export interface RequestLoanRequest {
  amount: number;
  installments: number;
}

export interface RequestLoanResult {
  loanId: string;
  amount: number;
  installments: number;
  interestRate: number;
  monthlyPayment: number;
  requiredApprovalRole: string;
  status: LoanStatus;
  requestedAt: string;
}

export interface RejectLoanRequest {
  reason: string;
}

export interface PaymentScheduleItem {
  installmentNumber: number;
  dueDate: string;
  paymentAmount: number;
}

export interface CustomerPaymentView {
  monthlyPayment: number;
  totalPayable: number;
  totalInterestCharged: number;
  firstDueDate: string;
  lastDueDate: string;
  isEstimated: boolean;
  paymentSchedule: PaymentScheduleItem[];
}

export interface BankProfitabilityView {
  totalPayable: number;
  grossInterestRevenue: number;
  estimatedFundingCost: number;
  expectedCreditLoss: number;
  estimatedOperationalCost: number;
  estimatedCapitalCharge: number;
  estimatedNetProfit: number;
  estimatedProfitMargin: number;
}

export interface WorkflowHistoryItem {
  action: string;
  performedBy: string;
  performedByRole: string;
  performedAt: string;
  comment?: string;
}

export interface LoanSummaryDetail {
  loanId: string;
  clientId: string;
  clientDisplayName: string;
  amount: number;
  installments: number;
  interestRateMonthly: number;
  monthlyPayment: number;
  requestedAt: string;
  requiredApprovalRole: string;
  status: LoanStatus;
  loanType: LoanType;
}

export interface LoanApprovalDetails {
  loanSummary: LoanSummaryDetail;
  customerPaymentView: CustomerPaymentView;
  bankProfitabilityView: BankProfitabilityView;
  workflowHistory: WorkflowHistoryItem[];
  payrollSummary: PayrollSummary | null;
}

export type EmploymentStatus = 'Active' | 'Inactive' | 'OnLeave';
export type LoanType = 'Personal' | 'Payroll';

export interface RequestPayrollLoanRequest {
  amount: number;
  installments: number;
  employerName: string;
  monthlySalary: number;
  employmentStatus: EmploymentStatus;
  existingPayrollDeductions: number;
}

export interface RequestPayrollLoanResult {
  loanId: string;
  amount: number;
  installments: number;
  interestRate: number;
  monthlyPayment: number;
  requiredApprovalRole: string;
  status: LoanStatus;
  requestedAt: string;
  payrollMarginLimit: number;
  availablePayrollMargin: number;
  remainingPayrollMargin: number;
  marginUsageAfterApproval: number;
}

export interface PayrollSummary {
  employerName: string;
  monthlySalary: number;
  employmentStatus: EmploymentStatus;
  existingPayrollDeductions: number;
  payrollMarginLimit: number;
  availablePayrollMargin: number;
  monthlyPayment: number;
  remainingPayrollMargin: number;
  marginUsageAfterApproval: number;
}

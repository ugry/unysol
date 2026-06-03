#!/bin/bash
# Module Consistency Check — CI gate
# Run from project root: bash scripts/check-module-consistency.sh

set -e
cd "$(dirname "$0")/.."
FAIL=0

echo "=== MODULE CONSISTENCY ==="

# =====================================================
# KNOWN MODULES (from DB schema + migrations)
# =====================================================
KNOWN_MODULES=(
    auth tenant_mgmt dashboard settings actions
    truck_tracking maintenance fuel_logging trailer_mgmt toll_tracking load_board tire_tracking
    invoice_mgmt expense_tracking billing cek_senet
    customer_mgmt trip_mgmt proposal_system contract_mgmt customer_portal
    employee_mgmt driver_leave driver_allowance driver_performance payslip
    predictions reports carbon_tracking export
)

# =====================================================
# FRONTEND PAGES → module map
# =====================================================
declare -A PAGE_MOD
PAGE_MOD[DashboardHome]=dashboard
PAGE_MOD[TrucksPage]=truck_tracking
PAGE_MOD[TripsPage]=trip_mgmt
PAGE_MOD[CustomersPage]=customer_mgmt
PAGE_MOD[InvoicesPage]=invoice_mgmt
PAGE_MOD[ExpensesPage]=expense_tracking
PAGE_MOD[EmployeesPage]=employee_mgmt
PAGE_MOD[CekSenetPage]=cek_senet
PAGE_MOD[LoadBoardPage]=load_board
PAGE_MOD[PredictionsPage]=predictions
PAGE_MOD[SettingsPage]=settings
PAGE_MOD[ActionsPage]=actions
PAGE_MOD[LoginPage]=auth
PAGE_MOD[LandingPage]=auth
PAGE_MOD[AdminDashboard]=tenant_mgmt
PAGE_MOD[HelpPage]=auth
PAGE_MOD[VerifyEmailPage]=auth
PAGE_MOD[TrailersPage]=trailer_mgmt
PAGE_MOD[FuelLogPage]=fuel_logging
PAGE_MOD[TollLogsPage]=toll_tracking
PAGE_MOD[MaintenancePage]=maintenance
PAGE_MOD[DriverLeavePage]=driver_leave
PAGE_MOD[TiresPage]=tire_tracking
PAGE_MOD[AllowancesPage]=driver_allowance
PAGE_MOD[DriverPerfPage]=driver_performance
PAGE_MOD[PayslipsPage]=payslip
PAGE_MOD[ProposalsPage]=proposal_system
PAGE_MOD[ContractsPage]=contract_mgmt
PAGE_MOD[CustomerPortalPage]=customer_portal
PAGE_MOD[ReportsPage]=reports
PAGE_MOD[CarbonTrackingPage]=carbon_tracking
PAGE_MOD[ExportPage]=export

# =====================================================
# BACKEND HANDLERS → module map
# =====================================================
declare -A HANDLER_MOD
HANDLER_MOD[trucks]=truck_tracking
HANDLER_MOD[trailers]=trailer_mgmt
HANDLER_MOD[trips]=trip_mgmt
HANDLER_MOD[customers]=customer_mgmt
HANDLER_MOD[invoices]=invoice_mgmt
HANDLER_MOD[expenses]=expense_tracking
HANDLER_MOD[employees]=employee_mgmt
HANDLER_MOD[cek_senet]=cek_senet
HANDLER_MOD[loadboard]=load_board
HANDLER_MOD[predictions]=predictions
HANDLER_MOD[settings]=settings
HANDLER_MOD[actions]=actions
HANDLER_MOD[auth]=auth
HANDLER_MOD[dashboard]=dashboard
HANDLER_MOD[billing]=billing
HANDLER_MOD[notifications]=notifications
HANDLER_MOD[fuel_log]=fuel_logging
HANDLER_MOD[toll_logs]=toll_tracking
HANDLER_MOD[maintenance]=maintenance
HANDLER_MOD[driver_leave]=driver_leave
HANDLER_MOD[tires]=tire_tracking
HANDLER_MOD[allowances]=driver_allowance
HANDLER_MOD[payslips]=payslip
HANDLER_MOD[proposals]=proposal_system
HANDLER_MOD[contracts]=contract_mgmt
HANDLER_MOD[reports]=reports

# =====================================================
# CORE MODULES (no dedicated page, always active)
# =====================================================
CORE_NO_PAGE=(
    auth tenant_mgmt settings notifications countries modules_mgmt
    billing tire_tracking driver_allowance driver_performance payslip
    proposal_system contract_mgmt customer_portal carbon_tracking export
)

# =====================================================
# RULE 1: Every registered module must have frontend OR backend
# =====================================================
echo "--- Rule 1: Modules without implementation ---"
for mod in "${KNOWN_MODULES[@]}"; do
    has_page=0; has_handler=0
    
    for p in "${!PAGE_MOD[@]}"; do
        [ "${PAGE_MOD[$p]}" = "$mod" ] && has_page=1
    done
    for h in "${!HANDLER_MOD[@]}"; do
        [ "${HANDLER_MOD[$h]}" = "$mod" ] && has_handler=1
    done
    
    is_core=0
    for c in "${CORE_NO_PAGE[@]}"; do
        [ "$c" = "$mod" ] && is_core=1
    done
    
    if [ $has_page -eq 0 ] && [ $has_handler -eq 0 ] && [ $is_core -eq 0 ]; then
        echo "  ❌ $mod: NO frontend page, NO backend handler"
        FAIL=1
    elif [ $has_page -eq 1 ] && [ $has_handler -eq 0 ]; then
        echo "  ⚠️  $mod: frontend OK, missing backend handler"
    elif [ $has_page -eq 0 ] && [ $has_handler -eq 1 ]; then
        echo "  ⚠️  $mod: backend OK, missing frontend page"
    elif [ $is_core -eq 1 ] && [ $has_page -eq 0 ]; then
        echo "  ℹ️  $mod: core/infra (no dedicated page needed)"
    fi
done

# =====================================================
# RULE 2: Frontend pages must be wired in App.tsx routes
# =====================================================
echo ""
echo "--- Rule 2: Frontend pages wired in App.tsx ---"
for page_file in frontend/src/pages/*.tsx; do
    page_name=$(basename "$page_file" .tsx)
    mod="${PAGE_MOD[$page_name]}"
    if [ -n "$mod" ] && ! grep -q "$page_name" frontend/src/App.tsx 2>/dev/null; then
        echo "  ❌ $page_name: NOT imported in App.tsx"
        FAIL=1
    fi
done

# =====================================================
# RULE 3: Module count
# =====================================================
echo ""
echo "--- Rule 3: Module count ---"
echo "  Registered: ${#KNOWN_MODULES[@]}"
if [ ${#KNOWN_MODULES[@]} -lt 21 ]; then
    echo "  ❌ Less than 21 modules"
    FAIL=1
else
    echo "  ✅ >= 21 modules"
fi

# =====================================================
echo ""
if [ $FAIL -eq 0 ]; then
    echo "=== PASS ==="
else
    echo "=== FAIL: $FAIL violation(s) ==="
    exit 1
fi

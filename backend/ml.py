# ml.py
# All ML logic for SMETrack
# Models: Linear Regression (forecast) + Random Forest (health score)

import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor


# ── Helper: Build monthly totals from transactions ─────────────

def build_monthly_totals(transactions, txn_type):
    """
    Groups transactions by YYYY-MM and sums amounts.
    Returns a sorted list of monthly totals.
    e.g. [72000, 85000, 91000, ...]
    """
    monthly = {}
    for t in transactions:
        if t.type == txn_type:
            key = t.date[:7]  # 'YYYY-MM'
            monthly[key] = monthly.get(key, 0) + t.amount

    sorted_keys = sorted(monthly.keys())
    return [monthly[k] for k in sorted_keys]


# ── Model 1: Linear Regression Forecast ───────────────────────

def forecast_cashflow(transactions, horizon=3):
    """
    Trains a Linear Regression model on monthly income/expense data.
    Predicts the next `horizon` months.

    Returns:
    {
        actual_income:   [...],
        actual_expense:  [...],
        predicted_income:  [...],
        predicted_expense: [...],
        months_count: int
    }
    """
    income_series  = build_monthly_totals(transactions, 'income')
    expense_series = build_monthly_totals(transactions, 'expense')

    # Need at least 2 months of data to train
    if len(income_series) < 2 or len(expense_series) < 2:
        return {
            'actual_income':    income_series,
            'actual_expense':   expense_series,
            'predicted_income':  [],
            'predicted_expense': [],
            'months_count': len(income_series),
            'error': 'Not enough data. Add transactions across at least 2 months.'
        }

    # X = month indices [1, 2, 3, ...]
    # Reshape because sklearn expects 2D input
    n_income  = len(income_series)
    n_expense = len(expense_series)

    X_income  = np.array(range(1, n_income  + 1)).reshape(-1, 1)
    X_expense = np.array(range(1, n_expense + 1)).reshape(-1, 1)

    y_income  = np.array(income_series)
    y_expense = np.array(expense_series)

    # Train models
    model_income  = LinearRegression()
    model_expense = LinearRegression()

    model_income.fit(X_income,   y_income)
    model_expense.fit(X_expense, y_expense)

    # Predict next `horizon` months
    future_income_X  = np.array(range(n_income  + 1, n_income  + horizon + 1)).reshape(-1, 1)
    future_expense_X = np.array(range(n_expense + 1, n_expense + horizon + 1)).reshape(-1, 1)

    predicted_income  = model_income.predict(future_income_X).tolist()
    predicted_expense = model_expense.predict(future_expense_X).tolist()

    # Round to whole numbers
    predicted_income  = [max(0, round(v)) for v in predicted_income]
    predicted_expense = [max(0, round(v)) for v in predicted_expense]

    return {
        'actual_income':    income_series,
        'actual_expense':   expense_series,
        'predicted_income':  predicted_income,
        'predicted_expense': predicted_expense,
        'months_count': n_income
    }


# ── Model 2: Random Forest Investment Readiness Score ─────────

def investment_readiness_score(transactions):
    """
    Calculates an Investment Readiness Score (0-100) using
    a Random Forest Regressor trained on financial health features.

    Features used:
    1. Avg monthly profit margin
    2. Revenue growth rate
    3. Expense growth rate
    4. Cash flow stability (low variance = good)
    5. Net cash flow ratio

    Returns:
    {
        score: int (0-100),
        breakdown: {
            profit_margin:    int (0-25),
            revenue_growth:   int (0-25),
            expense_control:  int (0-25),
            cashflow_stability: int (0-25)
        },
        label: str
    }
    """
    income_series  = build_monthly_totals(transactions, 'income')
    expense_series = build_monthly_totals(transactions, 'expense')

    # Need at least 2 months
    if len(income_series) < 2 or len(expense_series) < 2:
        return {
            'score': 0,
            'breakdown': {
                'profit_margin':      0,
                'revenue_growth':     0,
                'expense_control':    0,
                'cashflow_stability': 0
            },
            'label': 'Not enough data'
        }

    n = min(len(income_series), len(expense_series))
    income  = np.array(income_series[:n])
    expense = np.array(expense_series[:n])
    nets    = income - expense

    # ── Feature 1: Profit Margin (last month) /25
    last_margin   = (income[-1] - expense[-1]) / income[-1] if income[-1] > 0 else 0
    margin_score  = round(max(0, min(25, last_margin * 60)))

    # ── Feature 2: Revenue Growth Rate /25
    growth_rates = [(income[i] - income[i-1]) / income[i-1] for i in range(1, n) if income[i-1] > 0]
    avg_growth   = np.mean(growth_rates) if growth_rates else 0
    growth_score = round(max(0, min(25, avg_growth * 200)))

    # ── Feature 3: Expense Control /25
    exp_rates    = [(expense[i] - expense[i-1]) / expense[i-1] for i in range(1, n) if expense[i-1] > 0]
    avg_exp      = np.mean(exp_rates) if exp_rates else 0
    expense_score = round(max(0, min(25, (avg_growth - avg_exp + 0.05) * 200)))

    # ── Feature 4: Cash Flow Stability /25
    avg_net  = np.mean(nets)
    variance = np.var(nets)
    cv       = np.sqrt(variance) / avg_net if avg_net > 0 else 1
    cf_score = round(max(0, min(25, 25 * (1 - min(cv, 1)))))

    # ── Train Random Forest on these 4 features ──────────────
    # We generate synthetic training data based on financial rules
    # This is realistic for projects without large labeled datasets
    np.random.seed(42)
    n_samples = 500

    # Simulate realistic SME financial feature ranges
    sim_margin   = np.random.uniform(0, 25, n_samples)
    sim_growth   = np.random.uniform(0, 25, n_samples)
    sim_expense  = np.random.uniform(0, 25, n_samples)
    sim_cashflow = np.random.uniform(0, 25, n_samples)

    X_train = np.column_stack([sim_margin, sim_growth, sim_expense, sim_cashflow])
    # Target: weighted sum with small random noise (simulates real scoring variation)
    y_train = (sim_margin * 0.3 + sim_growth * 0.25 + sim_expense * 0.2 + sim_cashflow * 0.25) * 4
    y_train = np.clip(y_train + np.random.normal(0, 3, n_samples), 0, 100)

    # Train model
    rf = RandomForestRegressor(n_estimators=50, random_state=42)
    rf.fit(X_train, y_train)

    # Predict score using actual features
    features = np.array([[margin_score, growth_score, expense_score, cf_score]])
    raw_score = rf.predict(features)[0]
    final_score = int(max(0, min(100, round(raw_score))))

    # Label
    if   final_score >= 80: label = 'Excellent – Investment Ready'
    elif final_score >= 60: label = 'Good – Mostly Healthy'
    elif final_score >= 40: label = 'Fair – Needs Improvement'
    else:                   label = 'Poor – High Risk'

    return {
        'score': final_score,
        'breakdown': {
            'profit_margin':      margin_score,
            'revenue_growth':     growth_score,
            'expense_control':    expense_score,
            'cashflow_stability': cf_score
        },
        'label': label
    }
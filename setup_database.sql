-- 1. Create transactions table if missing
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  payment_mode TEXT NOT NULL,
  type TEXT DEFAULT 'expense',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CRITICAL FIX: Disable RLS for personal project so insert/select works freely!
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- 3. Create wallet table for storing the Global Editable Balance
CREATE TABLE IF NOT EXISTS wallet (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  balance NUMERIC NOT NULL DEFAULT 10000
);

-- 4. Disable RLS for wallet table
ALTER TABLE wallet DISABLE ROW LEVEL SECURITY;

-- 5. Insert one initial row into wallet table ONLY if empty
INSERT INTO wallet (balance) 
SELECT 10000 
WHERE NOT EXISTS (SELECT 1 FROM wallet);

-- 6. Function to Auto-Update Wallet Balance
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Subtract from wallet right away when expense added
    UPDATE wallet SET balance = balance - NEW.amount;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Add back to wallet when expense is deleted
    UPDATE wallet SET balance = balance + OLD.amount;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger to call the function on INSERT or DELETE
DROP TRIGGER IF EXISTS expense_wallet_trigger ON transactions;
CREATE TRIGGER expense_wallet_trigger
AFTER INSERT OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION update_wallet_balance();

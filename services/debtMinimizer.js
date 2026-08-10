function minimizeDebt(members, groupId) {
  let creditors = [];
  let debtors = [];

  // Separate members into creditors and debtors
  members.forEach((member) => {
    const amountOwed = Number(member.amount_owed);

    if (amountOwed > 0) {
      creditors.push({
        member_id: member.member_id,
        user_id: member.user_id,
        name: member.member_name,
        amount: amountOwed,
      });
    } else if (amountOwed < 0) {
      debtors.push({
        member_id: member.member_id,
        user_id: member.user_id,
        name: member.member_name,
        amount: Math.abs(amountOwed),
      });
    }
  });

  // Calculate minimum debt settlements
  let settlements = [];

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    // The smaller amount determines the payment
    const payment = Math.min(debtor.amount, creditor.amount);

    settlements.push({
      groupId: groupId,
      from_member_id: debtor.member_id,
      from_user_id: debtor.user_id,
      from_member_name: debtor.name,

      to_member_id: creditor.member_id,
      to_user_id: creditor.user_id,
      to_member_name: creditor.name,

      amount: payment,
    });

    // Reduce remaining balances
    debtor.amount -= payment;
    creditor.amount -= payment;

    // Move to next debtor if fully settled
    if (debtor.amount === 0) {
      i++;
    }

    // Move to next creditor if fully settled
    if (creditor.amount === 0) {
      j++;
    }
  }

  return settlements;
}

module.exports = minimizeDebt;

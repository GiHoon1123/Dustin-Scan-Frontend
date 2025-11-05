"use client";

interface TransactionCountButtonProps {
  count: number;
}

export default function TransactionCountButton({
  count,
}: TransactionCountButtonProps) {
  const handleClick = () => {
    const transactionsSection = document.getElementById("block-transactions");
    if (transactionsSection) {
      transactionsSection.scrollIntoView({ behavior: "smooth" });
      // 트랜잭션 섹션을 자동으로 펼치기
      const expandButton = transactionsSection.querySelector("button");
      if (expandButton) {
        const isExpanded = transactionsSection.querySelector(
          '[class*="space-y-3"]'
        );
        if (!isExpanded) {
          expandButton.click();
        }
      }
    }
  };

  if (count > 0) {
    return (
      <button
        onClick={handleClick}
        className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
      >
        {count} transactions
      </button>
    );
  }

  return <span className="text-gray-900 dark:text-white">{count}</span>;
}


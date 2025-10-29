import BlockCard from "@/components/BlockCard";
import Pagination from "@/components/Pagination";
import SearchBar from "@/components/SearchBar";
import { getBlocks } from "@/lib/api";

export default async function BlocksPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const blocksData = await getBlocks(page, 20);
  const blocks = blocksData.data.items;
  const pagination = blocksData.data.pagination;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        📦 All Blocks
      </h1>

      <SearchBar placeholder="Search by Block Number or Hash..." type="block" />

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Total {pagination.totalCount} blocks
        </div>
      </div>

      <div className="space-y-4">
        {blocks.map((block) => (
          <BlockCard key={block.hash} block={block} />
        ))}
      </div>

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        basePath="/blocks"
      />
    </div>
  );
}

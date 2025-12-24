import BlockCard from "@/components/BlockCard";
import Pagination from "@/components/Pagination";
import SearchBar from "@/components/SearchBar";
import CacheIndicator from "@/components/CacheIndicator";
import { getBlocks } from "@/lib/api";
import { CacheKeys } from "@/lib/cache";

export default async function BlocksPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  
  let blocks: any[] = [];
  let pagination = {
    currentPage: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  };
  let fromCache = false;

  try {
  const blocksData = await getBlocks(page, 20);
    blocks = blocksData.data.items;
    pagination = blocksData.data.pagination;
  } catch (error) {
    fromCache = true;
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">
        📦 All Blocks
      </h1>

      <SearchBar placeholder="Search by Block Number or Hash..." type="block" />

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
        <div className="flex items-center justify-between">
        <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
          Total {pagination.totalCount} blocks
          </div>
          {fromCache && <CacheIndicator cacheKey={CacheKeys.blocks(page, 20)} />}
        </div>
      </div>

      <div className="space-y-3 md:space-y-4">
        {blocks.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-300 text-center">
            서버 연결 실패
          </div>
        ) : (
          blocks.map((block) => (
          <BlockCard key={block.hash} block={block} />
          ))
        )}
      </div>

      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        basePath="/blocks"
      />
    </div>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="text-6xl font-bold text-gray-300 dark:text-gray-600 mb-4">
            404
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Record Not Found
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Your search did not match any records.
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-8 text-left">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Suggestions:
          </h2>
          <ul className="space-y-2 text-gray-600 dark:text-gray-400">
            <li>• Make sure that all words are spelled correctly.</li>
            <li>• Try different keywords.</li>
            <li>• Try more general keywords.</li>
            <li>• Check if the block number or hash exists on the blockchain.</li>
          </ul>
        </div>

        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Go to Home
          </Link>
          <Link
            href="/blocks"
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-semibold"
          >
            View All Blocks
          </Link>
        </div>
      </div>
    </div>
  );
}


"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { RequirementListResponse } from "@/lib/requirements";

type Props = {
  data: RequirementListResponse | null;
  apiError: boolean;
  page: number;
  pageSize: number;
  query: string;
};

export function RequirementsRegistry({ data, apiError, page, pageSize, query }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(query);
  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const hasPrev = page > 1;
  const hasNext = page < pageCount;
  const pageLink = (target: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (target !== 1) params.set("page", String(target));
    const suffix = params.toString();
    return suffix ? `/?${suffix}` : "/";
  };
  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleaned = search.trim();
    if (cleaned === query) return;
    router.push(cleaned ? `/?q=${encodeURIComponent(cleaned)}` : "/");
  }
  function clearSearch() {
    setSearch("");
    router.push("/");
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white" aria-labelledby="registry-title">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
        <div>
          <h3 id="registry-title" className="font-semibold">Requirements Registry</h3>
          <p className="mt-1 text-xs text-slate-500">
            Live records from FastAPI and PostgreSQL
          </p>
        </div>
        <span className="rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-600">
          {apiError ? "Unavailable" : `${total} total`}
        </span>
      </div>
      <form onSubmit={submitSearch} role="search" className="border-b border-slate-200 p-5">
        <label htmlFor="requirement-search" className="mb-2 block text-sm font-medium text-slate-700">
          Search all requirements
        </label>
        <div className="flex flex-wrap gap-2">
          <input id="requirement-search" type="search" value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, description or UUID" maxLength={200}
            disabled={apiError}
            className="min-w-48 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-offset-2 focus-visible:outline-2 focus-visible:outline-sky-600 disabled:bg-slate-100" />
          <button type="submit" disabled={apiError}
            className="rounded-md bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:bg-slate-400">
            Search
          </button>
          {query && (
            <button type="button" onClick={clearSearch} disabled={apiError}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
              Clear search
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Search the entire registry; results and pagination reflect your search.
        </p>
      </form>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] table-fixed text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th scope="col" className="w-[45%] px-5 py-4">Requirement</th>
              <th scope="col" className="w-[35%] px-5 py-4">Description</th>
              <th scope="col" className="w-[20%] px-5 py-4">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {apiError ? (
              <tr>
                <td colSpan={3} role="alert" className="px-5 py-12 text-center text-red-600">
                  Unable to connect to the Requirements API. Check FastAPI and PostgreSQL.
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-5 py-12 text-center text-slate-500">
                  {query ? "No matching requirements found." : "No requirements found."}
                </td>
              </tr>
            ) : rows.map((requirement) => (
              <tr key={requirement.id} className="hover:bg-slate-50">
                <td className="min-w-0 px-5 py-4 font-medium text-slate-900">
                  <Link
                    href={`/requirements/${requirement.id}`}
                    className="block min-w-0 text-slate-900 underline-offset-4 hover:text-sky-700 hover:underline focus-visible:outline-2 focus-visible:outline-sky-600"
                    title={requirement.title}
                  >
                    <span data-testid="requirement-registry-title" className="line-clamp-2 break-words [overflow-wrap:anywhere]">
                      {requirement.title}
                    </span>
                  </Link>
                  <p className="mt-1 font-mono text-xs text-slate-500">{requirement.id.slice(0, 8)}</p>
                </td>
                <td className="max-w-md px-5 py-4 text-slate-600">
                  <p className="line-clamp-2 break-words [overflow-wrap:anywhere]">{requirement.description}</p>
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                  {new Intl.DateTimeFormat("en-CA", {
                    dateStyle: "medium",
                    timeZone: "UTC",
                  }).format(new Date(requirement.created_at))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!apiError && total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4 text-sm">
          <span className="text-slate-600">
            Page {page} of {pageCount} · Records {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
          </span>
          <nav aria-label="Requirements pages" className="flex items-center gap-2">
            {hasPrev ? (
              <Link className="rounded-md border border-slate-300 px-3 py-2 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-sky-600" href={pageLink(page - 1)}>Previous</Link>
            ) : (
              <span aria-disabled="true" className="rounded-md border border-slate-200 px-3 py-2 text-slate-400">Previous</span>
            )}
            {hasNext ? (
              <Link className="rounded-md border border-slate-300 px-3 py-2 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-sky-600" href={pageLink(page + 1)}>Next</Link>
            ) : (
              <span aria-disabled="true" className="rounded-md border border-slate-200 px-3 py-2 text-slate-400">Next</span>
            )}
          </nav>
        </div>
      )}
    </section>
  );
}

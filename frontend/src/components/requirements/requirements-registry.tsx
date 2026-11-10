"use client";

import { useState } from "react";
import Link from "next/link";
import type { RequirementListResponse } from "@/lib/requirements";

type Props = {
  data: RequirementListResponse | null;
  apiError: boolean;
  page: number;
  pageSize: number;
};

export function RequirementsRegistry({ data, apiError, page, pageSize }: Props) {
  const [search, setSearch] = useState("");
  const query = search.trim().toLocaleLowerCase();
  const rows = (data?.items ?? []).filter((requirement) =>
    [requirement.title, requirement.description, requirement.id]
      .some((value) => value.toLocaleLowerCase().includes(query)),
  );
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const hasPrev = page > 1;
  const hasNext = page < pageCount;
  const pageLink = (target: number) => target === 1 ? "/" : `/?page=${target}`;

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
      <div className="border-b border-slate-200 p-5">
        <label htmlFor="requirement-search" className="mb-2 block text-sm font-medium text-slate-700">
          Search requirements on this page
        </label>
        <input
          id="requirement-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by title, description or UUID"
          disabled={apiError}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-offset-2 focus-visible:outline-2 focus-visible:outline-sky-600 disabled:bg-slate-100"
        />
        <p className="mt-2 text-xs text-slate-500">
          This filter searches only the {data?.items.length ?? 0} records on the current page.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th scope="col" className="px-5 py-4">Requirement</th>
              <th scope="col" className="px-5 py-4">Description</th>
              <th scope="col" className="px-5 py-4">Created</th>
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
                  {query ? "No matching requirements on this page." : "No requirements found."}
                </td>
              </tr>
            ) : rows.map((requirement) => (
              <tr key={requirement.id} className="hover:bg-slate-50">
                <td className="px-5 py-4 font-medium text-slate-900">
                  <Link
                    href={`/requirements/${requirement.id}`}
                    className="text-slate-900 underline-offset-4 hover:text-sky-700 hover:underline focus-visible:outline-2 focus-visible:outline-sky-600"
                  >
                    {requirement.title}
                  </Link>
                  <p className="mt-1 font-mono text-xs text-slate-500">{requirement.id.slice(0, 8)}</p>
                </td>
                <td className="max-w-md px-5 py-4 text-slate-600">
                  <p className="line-clamp-2">{requirement.description}</p>
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
            Page {page} of {pageCount} · Records {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
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

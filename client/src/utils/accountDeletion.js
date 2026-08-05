export async function deleteAccountAndRefresh({ api, accountId, removeLocally, refresh }) {
  const response = await api.delete(`/accounts/${accountId}`);
  removeLocally(accountId);
  await refresh();
  return response.data.message;
}

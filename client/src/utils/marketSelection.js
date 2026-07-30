export function toggleMarketSelection(selectedMarket, clickedMarket) {
  return selectedMarket === clickedMarket ? '' : clickedMarket;
}

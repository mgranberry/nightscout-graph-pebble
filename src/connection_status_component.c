#include "config.h"
#include "connection_status_component.h"
#include "staleness.h"

#define REASON_ICON_WIDTH 25
#define TEXT_WIDTH 40

// https://forums.getpebble.com/discussion/7147/text-layer-padding
#define ACTUAL_TEXT_HEIGHT_18 11
#define PADDING_TOP_18 7
#define PADDING_BOTTOM_18 3

// This matches STALENESS_REASON_*
const int CONN_ISSUE_ICONS[] = {
  NO_ICON,
  RESOURCE_ID_CONN_ISSUE_BLUETOOTH,
  RESOURCE_ID_CONN_ISSUE_NETWORK,
  RESOURCE_ID_CONN_ISSUE_RIG,
};

ConnectionStatusComponent* connection_status_component_create(Layer *parent, int x, int y) {
  BitmapLayer *icon_layer = bitmap_layer_create(GRect(x, y, REASON_ICON_WIDTH, REASON_ICON_WIDTH));
  bitmap_layer_set_compositing_mode(icon_layer, GCompOpAssign);
  layer_add_child(parent, bitmap_layer_get_layer(icon_layer));

  TextLayer *staleness_text = text_layer_create(GRect(
    x + REASON_ICON_WIDTH + 1,
    y + (REASON_ICON_WIDTH - ACTUAL_TEXT_HEIGHT_18) / 2 - PADDING_TOP_18,
    TEXT_WIDTH,
    ACTUAL_TEXT_HEIGHT_18 + PADDING_TOP_18 + PADDING_BOTTOM_18
  ));
  text_layer_set_font(staleness_text, fonts_get_system_font(FONT_KEY_GOTHIC_18_BOLD));
  text_layer_set_background_color(staleness_text, GColorClear);
  text_layer_set_text_alignment(staleness_text, GTextAlignmentLeft);
  layer_add_child(parent, text_layer_get_layer(staleness_text));

  ConnectionStatusComponent *c = malloc(sizeof(ConnectionStatusComponent));
  c->icon_layer = icon_layer;
  c->icon_bitmap = NULL;
  c->staleness_text = staleness_text;
  return c;
}

void connection_status_component_destroy(ConnectionStatusComponent *c) {
  text_layer_destroy(c->staleness_text);
  if (c->icon_bitmap != NULL) {
    gbitmap_destroy(c->icon_bitmap);
  }
  bitmap_layer_destroy(c->icon_layer);
  free(c);
}

static char* staleness_text(int staleness_seconds) {
  static char buf[8];
  int minutes = staleness_seconds / 60;
  if (minutes < 60) {
    snprintf(buf, sizeof(buf), "%d", minutes);
  } else if (minutes < 120) {
    snprintf(buf, sizeof(buf), "1h%d", minutes - 60);
  } else if (minutes / 60 <= 6) {
    snprintf(buf, sizeof(buf), "%dhr", minutes / 60);
  } else {
    strcpy(buf, "!");
  }
  return buf;
}

void connection_status_component_refresh(ConnectionStatusComponent *c) {
  ConnectionIssue issue = connection_issue();
  if (issue.reason == CONNECTION_ISSUE_NONE) {
    layer_set_hidden(bitmap_layer_get_layer(c->icon_layer), true);
    layer_set_hidden(text_layer_get_layer(c->staleness_text), true);
  } else {
    layer_set_hidden(bitmap_layer_get_layer(c->icon_layer), false);
    if (c->icon_bitmap != NULL) {
      gbitmap_destroy(c->icon_bitmap);
    }
    c->icon_bitmap = gbitmap_create_with_resource(CONN_ISSUE_ICONS[issue.reason]);
    bitmap_layer_set_bitmap(c->icon_layer, c->icon_bitmap);

    layer_set_hidden(text_layer_get_layer(c->staleness_text), false);
    text_layer_set_text(c->staleness_text, staleness_text(issue.staleness));
  }
}
